from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# SQLite 데이터베이스 파일 경로 (backend 폴더 내 고정)
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "pigent.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# SQLite용 엔진 생성 (check_same_thread=False: FastAPI에서 사용하기 위해 필요)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# 세션 로컬 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 생성 (모든 모델이 상속받을 클래스)
Base = declarative_base()

# 데이터베이스 세션 dependency
def get_db():
    """
    FastAPI dependency로 사용될 함수
    요청마다 새로운 DB 세션을 생성하고 종료 시 자동으로 닫음
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
