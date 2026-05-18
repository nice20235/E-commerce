# StepUp API

Backend API for StepUp — an online footwear store built with FastAPI.

## Tech Stack

- **Runtime**: Python 3.12, FastAPI, Uvicorn
- **Database**: PostgreSQL (async) via SQLAlchemy 2.0 + asyncpg
- **Auth**: JWT (access + refresh) in HttpOnly cookies, bcrypt password hashing
- **Validation**: Pydantic v2

## Setup

1. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**

   Create a `.env` file with the required variables (see `config.py` for the full list).
   At minimum set `DATABASE_URL` and a strong `SECRET_KEY`.

3. **Run**

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Security Notes

- Never commit `.env` — it is in `.gitignore`.
- Set `DEBUG=False` and restrict `ALLOWED_ORIGINS` before deploying.
- Run behind a reverse proxy (nginx) with TLS so that `COOKIE_SECURE=True` works.
- Swagger UI is only available when `DEBUG=True`.
