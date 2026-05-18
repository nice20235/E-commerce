# StepUp

Online footwear store — modern e-commerce platform for slippers and casual shoes.

## Stack

**Backend** — FastAPI · PostgreSQL · SQLAlchemy · PyJWT  
**Frontend** — React 18 · TypeScript · Vite · TailwindCSS

## Features

- Product catalog with search, filters, and sorting
- Shopping cart and order management
- Secure authentication with HttpOnly cookies
- Admin panel — products, orders, users
- Payment integration
- Bilingual interface (Uzbek / Russian)
- Mobile-first responsive design

## Project Structure

```
BackEnd/   — FastAPI application
FrontEnd/  — React + Vite application
```

## Run Locally

**Backend**
```bash
cd BackEnd
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd FrontEnd
npm install
npm run dev
```
