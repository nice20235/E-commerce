from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict
import os
import asyncio
from uuid import uuid4
import logging
from app.db.database import get_db
from app.auth.dependencies import get_current_admin
from app.core.cache import cached, invalidate_cache_pattern
from app.core.config import settings
from app.crud.stepup import (
    get_slipper,
    get_slippers,
    update_slipper,
    delete_slipper,
)
from app.models.stepup import StepUp, StepUpImage
from app.schemas.stepup import StepUpCreate, StepUpUpdate


# Set up logging
logger = logging.getLogger(__name__)


router = APIRouter()


# ---------------------------
# Helpers (local to endpoint)
# ---------------------------
async def _fetch_images_by_stepup(
    db: AsyncSession, stepup_ids: List[int]
) -> Dict[int, List[dict]]:
    """Batch load images for provided stepup IDs and group them by stepup_id.

    Returns dict: { stepup_id: [ {id, image_path, is_primary, alt_text, order_index}, ... ] }
    """
    if not stepup_ids:
        return {}

    rows = await db.execute(
        select(StepUpImage)
        .where(StepUpImage.slipper_id.in_(stepup_ids))
        .order_by(asc(StepUpImage.slipper_id), asc(StepUpImage.order_index), asc(StepUpImage.id))
    )
    images_by_stepup: Dict[int, List[dict]] = {}
    for img in rows.scalars().all():
        images_by_stepup.setdefault(int(img.slipper_id), []).append(
            {
                "id": img.id,
                "image_path": img.image_path,
                "is_primary": img.is_primary,
                "alt_text": img.alt_text,
                "order_index": img.order_index,
            }
        )
    return images_by_stepup


def _serialize_stepup(stepup, *, images: Optional[List[dict]] = None) -> dict:
    return {
        "id": stepup.id,
        "name": stepup.name,
        "size": stepup.size,
        "price": stepup.price,
        "quantity": stepup.quantity,
        "image": stepup.image,
        **({"images": images} if images is not None else {}),
        "is_available": stepup.quantity > 0,
    }


@router.get("/")
@cached(ttl=900, key_prefix="stepups")
async def read_slippers(
    skip: int = Query(0, ge=0, description="Skip items for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Limit items per page"),
    search: Optional[str] = Query(None, description="Search in name and size"),
    sort: str = Query(
        "id_desc",
        description="Sort order: id_asc,id_desc,name_asc,name_desc,price_asc,price_desc,created_asc,created_desc",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get all stepups with filtering, pagination, search and sorting."""
    try:
        slippers, total = await get_slippers(
            db,
            skip=skip,
            limit=limit,
            search=search,
            sort=sort,
        )
        # Batch-load images and serialize
        images_by_stepup = await _fetch_images_by_stepup(db, [s.id for s in slippers])
        items = [_serialize_stepup(s, images=images_by_stepup.get(int(s.id), [])) for s in slippers]

        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "pages": (total + limit - 1) // limit,
            "has_next": skip + limit < total,
            "has_prev": skip > 0,
            "sort": sort,
        }
    except Exception as e:
        logger.error(f"Error fetching stepups: {e}")
        raise HTTPException(status_code=500, detail="Error fetching stepups")


@router.get("/{slipper_id}")
@cached(ttl=900, key_prefix="stepup")
async def read_slipper(
    slipper_id: int,
    include_images: bool = Query(False, description="Include stepup images"),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific stepup by ID with optional image loading."""
    try:
        stepup = await get_slipper(db, slipper_id=slipper_id, load_images=include_images)
        if stepup is None:
            raise HTTPException(status_code=404, detail="StepUp not found")
        # Serialize, include images if requested
        images = None
        if include_images and hasattr(stepup, "images"):
            images = [
                {
                    "id": img.id,
                    "image_path": img.image_path,
                    "is_primary": img.is_primary,
                    "alt_text": img.alt_text,
                    "order_index": img.order_index,
                }
                for img in stepup.images
            ]
        base = _serialize_stepup(stepup, images=images)
        base.update(
            {
                "created_at": stepup.created_at.isoformat(),
                "updated_at": stepup.updated_at.isoformat() if stepup.updated_at else None,
            }
        )
        return base
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stepup {slipper_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching stepup")




@router.post("/", summary="Создать stepup (без картинки)")
async def create_new_slipper(
    slipper: StepUpCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """
    Создать новый stepup (admin only) через JSON. Картинку загружать отдельным запросом.
    """
    db_slipper = StepUp(
        name=slipper.name,
        size=slipper.size,
        price=slipper.price,
        quantity=slipper.quantity,
        image="",
    )
    db.add(db_slipper)
    await db.commit()
    await db.refresh(db_slipper)
    
    await invalidate_cache_pattern("stepups:")

    return {
        "id": db_slipper.id,
        "name": db_slipper.name,
        "size": db_slipper.size,
        "price": db_slipper.price,
        "quantity": db_slipper.quantity,
        "image": db_slipper.image,
    }


@router.put("/{slipper_id}")
async def update_existing_slipper(
    slipper_id: int,
    slipper: StepUpUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """
    Update a stepup item (Admin only).
    """
    # Load existing stepup
    existing = await get_slipper(db, slipper_id=slipper_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="StepUp not found")
    # Build update model from provided fields
    # Update with provided partial fields
    db_slipper = await update_slipper(db, existing, slipper)
    
    # Clear cache after updating
    await invalidate_cache_pattern("stepups:")
    await invalidate_cache_pattern(f"stepup:{slipper_id}:")

    return {
        "id": db_slipper.id,
        "name": db_slipper.name,
        "size": db_slipper.size,
        "price": db_slipper.price,
        "quantity": db_slipper.quantity,
        "image": db_slipper.image,
    }


@router.delete("/{slipper_id}")
async def delete_existing_slipper(
    slipper_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """
    Delete a stepup item (Admin only).
    """
    try:
        db_slipper = await get_slipper(db, slipper_id=slipper_id)
        if db_slipper is None:
            raise HTTPException(status_code=404, detail="StepUp not found")

        await delete_slipper(db, db_slipper=db_slipper)

        await invalidate_cache_pattern("stepups:")
        await invalidate_cache_pattern(f"stepup:{slipper_id}:")

        return {"message": "StepUp deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stepup {slipper_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting stepup")


@router.post("/{slipper_id}/upload-images", summary="Загрузить несколько изображений для stepup")
async def upload_slipper_images(
    slipper_id: int,
    images: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """Upload one or many images for a stepup. First image becomes main image if not set."""
    slipper = await get_slipper(db, slipper_id=slipper_id)
    if not slipper:
        raise HTTPException(status_code=404, detail="StepUp not found")

    if len(images) > 10:
        raise HTTPException(status_code=400, detail="Too many images. Maximum 10 images allowed.")

    uploaded_images: List[dict] = []
    first_image_path: Optional[str] = None
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static/images"))
    # Create directory off the event loop to avoid blocking
    await asyncio.to_thread(os.makedirs, upload_dir, exist_ok=True)

    for i, image in enumerate(images):
        data = await image.read()

        # Size check must come before magic-byte inspection so we don't read
        # an unbounded payload into memory first.
        if len(data) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds the {settings.MAX_IMAGE_SIZE_MB} MB size limit",
            )

        # Validate file type by inspecting magic bytes, NOT the client-supplied
        # filename extension. The filename is fully attacker-controlled and must
        # never be trusted for security decisions.
        #
        # Magic byte signatures:
        #   JPEG  : FF D8 FF
        #   PNG   : 89 50 4E 47 0D 0A 1A 0A
        #   GIF   : 47 49 46 38
        #   WEBP  : 52 49 46 46 ... 57 45 42 50  (bytes 0-3 and 8-11)
        _MAGIC = {
            b"\xff\xd8\xff": ".jpg",
            b"\x89PNG\r\n\x1a\n": ".png",
            b"GIF8": ".gif",
        }
        detected_ext: str | None = None
        for magic, ext_candidate in _MAGIC.items():
            if data[:len(magic)] == magic:
                detected_ext = ext_candidate
                break
        # WEBP: starts with RIFF and has WEBP at offset 8
        if detected_ext is None and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            detected_ext = ".webp"

        if detected_ext is None:
            # SVG is intentionally excluded: SVG can embed <script> tags and
            # would be served as a static file, creating a stored XSS vector.
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Allowed: jpg, jpeg, png, webp, gif",
            )

        filename = f"{uuid4().hex}{detected_ext}"
        file_path = os.path.join(upload_dir, filename)

        def _write_bytes(path, data_bytes):
            with open(path, "wb") as f:
                f.write(data_bytes)
        await asyncio.to_thread(_write_bytes, file_path, data)
        relative_path = f"/static/images/{filename}"

        slipper_image = StepUpImage(
            slipper_id=slipper_id,
            image_path=relative_path,
            order_index=i,
        )
        db.add(slipper_image)

        if first_image_path is None:
            first_image_path = relative_path

        uploaded_images.append(
            {
                "image_path": relative_path,
                "order_index": i,
            }
        )

    if (not slipper.image) and first_image_path:
        slipper.image = first_image_path
        db.add(slipper)

    await db.commit()

    await invalidate_cache_pattern("stepups:")
    await invalidate_cache_pattern(f"stepup:{slipper_id}:")

    return {
        "slipper_id": slipper_id,
        "uploaded_images": uploaded_images,
        "total_uploaded": len(uploaded_images),
    }


@router.get("/{slipper_id}/images", summary="Получить все изображения stepup")
async def get_slipper_images(
    slipper_id: int, db: AsyncSession = Depends(get_db)
):
    """Получить все изображения для конкретного stepup."""
    slipper = await get_slipper(db, slipper_id=slipper_id)
    if not slipper:
        raise HTTPException(status_code=404, detail="StepUp not found")

    result = await db.execute(
        select(StepUpImage)
        .where(StepUpImage.slipper_id == slipper_id)
        .order_by(asc(StepUpImage.order_index))
    )
    images = result.scalars().all()

    return {
        "slipper_id": slipper_id,
        "images": [
            {
                "id": img.id,
                "image_path": img.image_path,
                "is_primary": img.is_primary,
                "alt_text": img.alt_text,
                "order_index": img.order_index,
                "created_at": img.created_at,
            }
            for img in images
        ],
        "total_images": len(images),
    }


@router.delete("/{slipper_id}/images/{image_id}", summary="Удалить изображение stepup")
async def delete_slipper_image(
    slipper_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """Удалить конкретное изображение stepup."""
    result = await db.execute(
        select(StepUpImage)
        .where(StepUpImage.id == image_id)
        .where(StepUpImage.slipper_id == slipper_id)
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        static_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../static")
        )
        # Resolve the file path and verify it stays inside the static directory
        # to prevent any path-traversal attack via a manipulated image_path DB value.
        file_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../", image.image_path.lstrip("/"))
        )
        if not file_path.startswith(static_root + os.sep) and file_path != static_root:
            logger.warning(f"Refusing to delete file outside static dir: {file_path}")
        else:
            exists = await asyncio.to_thread(os.path.exists, file_path)
            if exists:
                await asyncio.to_thread(os.remove, file_path)
    except Exception as e:
        logger.warning(f"Failed to delete physical file {image.image_path}: {e}")

    await db.delete(image)
    await db.commit()

    await invalidate_cache_pattern("stepups:")
    await invalidate_cache_pattern(f"stepup:{slipper_id}:")

    return {"message": "Image deleted successfully", "deleted_image_id": image_id}
