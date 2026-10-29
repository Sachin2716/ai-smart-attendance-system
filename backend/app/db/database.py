from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Configure database engine
db_url = settings.DATABASE_URL
if db_url.startswith("file:"):
    db_url = "sqlite:///" + db_url.replace("file:", "")

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that yields a database session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
