from sqlalchemy.orm import Session
from . import models, schemas

# Create user
def create_user(db: Session, user: schemas.UserCreate, photo_path: str):
    db_user = models.User(nom=user.nom, etablissement=user.etablissement, photo_path=photo_path)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Read user by id
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# Read all users
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# Update user
def update_user(db: Session, user_id: int, user: schemas.UserCreate):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.nom = user.nom
        db_user.etablissement = user.etablissement
        db.commit()
        db.refresh(db_user)
    return db_user

# Delete user
def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user