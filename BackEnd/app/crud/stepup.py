from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_, or_
from app.models.stepup import StepUp
from app.schemas.stepup import StepUpCreate, StepUpUpdate
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


async def get_slipper(db: AsyncSession, slipper_id: int, load_images: bool = False):
    query = select(StepUp)
    if load_images:
        query = query.options(selectinload(StepUp.images))
    result = await db.execute(query.where(StepUp.id == slipper_id))
    return result.scalar_one_or_none()


async def get_slippers(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort: str = "id_desc"
) -> Tuple[List[StepUp], int]:
    base_query = select(StepUp)
    conditions = []

    if search:
        _escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        conditions.append(
            or_(
                StepUp.name.ilike(f"%{_escaped}%", escape="\\"),
                StepUp.size.ilike(f"%{_escaped}%", escape="\\"),
            )
        )

    if conditions:
        base_query = base_query.where(and_(*conditions))

    sort_map = {
        "id_asc": StepUp.id.asc(),
        "id_desc": StepUp.id.desc(),
        "name_asc": StepUp.name.asc(),
        "name_desc": StepUp.name.desc(),
        "price_asc": StepUp.price.asc(),
        "price_desc": StepUp.price.desc(),
        "created_asc": StepUp.created_at.asc(),
        "created_desc": StepUp.created_at.desc(),
    }
    data_query = base_query.order_by(sort_map.get(sort, StepUp.id.desc())).offset(skip).limit(limit)

    count_query = select(func.count(StepUp.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))

    count_result = await db.execute(count_query)
    total = int(count_result.scalar() or 0)
    data_result = await db.execute(data_query)
    items = data_result.scalars().all()
    return items, total


async def create_slipper(db: AsyncSession, slipper_data: dict):
    db_slipper = StepUp(**slipper_data)
    db.add(db_slipper)
    await db.commit()
    await db.refresh(db_slipper)
    logger.info(f"Created stepup with ID: {db_slipper.id}")
    return db_slipper


async def update_slipper(db: AsyncSession, db_slipper: StepUp, slipper_update: StepUpUpdate):
    for field, value in slipper_update.model_dump(exclude_unset=True).items():
        setattr(db_slipper, field, value)
    db.add(db_slipper)
    await db.commit()
    await db.refresh(db_slipper)
    logger.info(f"Updated stepup with ID: {db_slipper.id}")
    return db_slipper


async def delete_slipper(db: AsyncSession, db_slipper: StepUp):
    await db.delete(db_slipper)
    await db.commit()
