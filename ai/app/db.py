"""
FarmBalance AI 서버 DB 연결.
SQLAlchemy sync engine (psycopg3 드라이버) 사용.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings


def get_engine():
    """SQLAlchemy sync engine을 생성합니다."""
    settings = get_settings()
    if not settings.DATABASE_URL:
        return None
    return create_engine(
        settings.DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )


# 세션 팩토리
_engine = None
_SessionLocal = None


def _init_session_factory() -> sessionmaker | None:
    """지연 초기화로 세션 팩토리를 생성합니다."""
    global _engine, _SessionLocal
    if _SessionLocal is None:
        _engine = get_engine()
        if _engine is None:
            return None
        _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)
    return _SessionLocal


def get_db_session() -> Session | None:
    """DB 세션을 반환합니다. with 문으로 사용하세요."""
    factory = _init_session_factory()
    if factory is None:
        return None
    return factory()


def check_db_connection() -> dict:
    """DB 연결 상태를 확인합니다."""
    settings = get_settings()
    if not settings.DATABASE_URL:
        return {"status": "not_configured", "message": "DATABASE_URL 환경변수가 설정되지 않았습니다"}
    try:
        session = get_db_session()
        if session is None:
            return {"status": "not_configured"}
        result = session.execute(text("SELECT 1"))
        row = result.scalar()
        session.close()
        return {"status": "connected", "result": row}
    except Exception as e:
        return {"status": "error", "message": str(e)}
