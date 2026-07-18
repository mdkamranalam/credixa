# Local Development Guide

This guide explains how to run the Credixa platform on your local machine for development purposes. You can either run the entire ecosystem seamlessly using Docker, or run individual services standalone.

---

## 1. Running with Docker (Recommended)

The easiest way to spin up the entire Credixa ecosystem (PostgreSQL, PgBouncer, Redis, Backend API Gateway, Python Risk Engine, and Frontend UI) is via Docker Compose.

### Prerequisites
- Docker & Docker Compose installed.

### Steps
1. Navigate to the root directory of the project:
   ```bash
   cd credixa
   ```
2. Build and start the containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```
3. To view the logs of all services in real-time:
   ```bash
   docker-compose logs -f
   ```
4. **Accessing the Services:**
   - **Frontend UI:** `http://localhost:5173`
   - **Backend API Gateway:** `http://localhost:3000`
   - **AI Risk Engine (FastAPI):** `http://localhost:8000`

### Stopping the Services
To stop the environment and preserve your database volumes:
```bash
docker-compose down
```
To stop the environment and **delete** all local databases and Redis caches:
```bash
docker-compose down -v
```

---

## 2. Running Services Individually (Standalone)

If you prefer to run services manually (e.g., to use standard debuggers), you must ensure that PostgreSQL (port 5432) and Redis (port 6379) are already running on your machine.

### A. Infrastructure Requirements
Ensure you have local instances of PostgreSQL and Redis running.
*Note: The backend depends on `pgbouncer` locally if using the Docker setup, but standalone it can connect directly to PostgreSQL. Ensure your `.env` files in `backend-gateway` and `risk-engine` point to `localhost` rather than the docker service names.*

### B. Backend API Gateway (Node.js/Express)

**Prerequisites:** Node.js v18+

1. Navigate to the backend directory:
   ```bash
   cd backend-gateway
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (uses `nodemon` for hot-reloading):
   ```bash
   npm run dev
   ```
   *The server will automatically run database migrations on startup.*

### C. AI Risk Engine (Python/FastAPI)

**Prerequisites:** Python 3.10+

1. Navigate to the risk-engine directory:
   ```bash
   cd risk-engine
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server using Uvicorn (hot-reloading enabled):
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### D. Frontend UI (React/Vite)

**Prerequisites:** Node.js v18+

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *By default, the Vite server will be available at `http://localhost:5173`. Any API calls to `/api` will be proxied to `http://localhost:3000` via the `vite.config.js` settings.*

---

## Troubleshooting

- **Database Errors on Standalone:** Ensure your `DB_HOST` in `backend-gateway/.env` is set to `localhost` and not `pgbouncer`. 
- **Redis Connection Errors:** Ensure `REDIS_HOST` is set to `localhost` in both the Node backend and Python risk engine.
- **Port Conflicts:** Ensure ports 3000, 5173, 8000, 5432, and 6379 are not occupied by other services on your machine before running `docker-compose up` or starting individual servers.

---

## 3. Accessing PostgreSQL (Docker)

When running the application with Docker, you might want to inspect the database directly. 

### Method 1: Connecting via psql inside the container
You can drop into the PostgreSQL interactive terminal directly inside the running container:
```bash
docker exec -it credixa-postgres psql -U credixa_admin -d credixa_db
```
*(This uses the default credentials specified in `docker-compose.yml`)*

### Method 2: Connecting via a GUI (e.g., pgAdmin, DBeaver)
Because the `postgres` container binds to port `5432` on your host machine, you can connect using any desktop SQL client using these settings:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `credixa_db`
- **Username:** `credixa_admin`
- **Password:** *(the value of `DB_PASSWORD` set in your `.env` file)*

*Note: You can also connect to PgBouncer on port `6432` with the same credentials.*
