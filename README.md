# Context Hunter

A web-based game where users guess the meaning of difficult sentences based on context.

## Project Structure

*   **`app/`**: Frontend (React + TypeScript + Vite + Tailwind CSS)
*   **`backend/`**: Backend (FastAPI + Python + MariaDB/SQLite)

## Getting Started

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

Navigate to the `app` directory:

```bash
cd app
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment

See `deploy_guide.md` for instructions on deploying to the school server.
