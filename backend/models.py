from sqlalchemy import Column, Integer, String
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    etablissement = Column(String, index=True)
    photo_path = Column(String, unique=True, nullable=False)