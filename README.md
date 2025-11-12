# Able
# Hourly Average Project (backend + frontend)

This scaffold contains a minimal backend (Nest-like TypeScript service) and a frontend (Vite React).
It is intended as a starting point for the take-home exercise. The backend connects to a market websocket,
aggregates hourly averages and persists into SQLite. The frontend connects via WebSocket and displays realtime ticks.

## How to use

### With Docker (recommended)
1. Copy your Finnhub API key into `backend/.env` as `FINNHUB_KEY`.
2. From project root run:
   ```bash
   docker-compose up --build
   ```
3. Frontend will be served at http://localhost:5173
4. Backend HTTP (if any) at http://localhost:3001 and WS at ws://localhost:3001/ws

### Without Docker (WSL / local)
Backend:
```bash
cd backend
npm install
npm run dev
```
Frontend:
```bash
cd frontend
npm install
npm run dev
```

## What included
- backend/: TypeScript backend source, minimal scripts
- frontend/: Vite React app
- docker-compose.yml to run both services and persist sqlite file

## Notes
- This scaffold uses TypeORM patterns. In production switch off synchronize and use migrations.
- Replace FINNHUB_KEY in backend/.env before running backend.
