"""Backend de la stack de démonstration. Aucun secret dans les sources."""
import os
import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ValaDeploy CNB Stack Test")
origins = [v.strip().rstrip('/') for v in (
    os.getenv('FRONTEND_URL', ''), os.getenv('CORS_ORIGIN', ''),
) if v.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET'], allow_headers=['*'])


@app.get('/health')
def liveness():
    """Vérification processus, indépendante du démarrage PostgreSQL."""
    return {'status': 'up', 'component': 'back'}


@app.get('/api/v1/health')
def stack_health():
    """Vérifie le vrai lien BACK -> DATABASE."""
    url = os.getenv('DATABASE_URL', '')
    if not url:
        raise HTTPException(status_code=503, detail='Database connection unavailable')
    try:
        with psycopg.connect(url, connect_timeout=3) as conn:
            with conn.cursor() as cursor:
                cursor.execute('SELECT 1')
                ok = cursor.fetchone() == (1,)
    except (psycopg.Error, OSError):
        raise HTTPException(status_code=503, detail='Database unavailable') from None
    if not ok:
        raise HTTPException(status_code=503, detail='Database query failed')
    return {'status': 'ok', 'backend': 'fastapi', 'database': 'connected'}
