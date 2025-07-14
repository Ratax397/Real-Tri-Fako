import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import SessionLocal, engine, Base
import shutil
import face_recognition

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS pour permettre l'accès du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dépendance DB

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = "photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CRUD Utilisateurs
@app.post("/users/", response_model=schemas.UserRead)
def create_user(nom: str = Form(...), etablissement: str = Form(...), photo: UploadFile = File(...), db: Session = Depends(get_db)):
    photo_path = os.path.join(UPLOAD_DIR, photo.filename)
    with open(photo_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    user = schemas.UserCreate(nom=nom, etablissement=etablissement)
    return crud.create_user(db, user, photo_path)

@app.get("/users/", response_model=list[schemas.UserRead])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=schemas.UserRead)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/users/{user_id}", response_model=schemas.UserRead)
def update_user(user_id: int, nom: str = Form(...), etablissement: str = Form(...), db: Session = Depends(get_db)):
    user = schemas.UserCreate(nom=nom, etablissement=etablissement)
    db_user = crud.update_user(db, user_id, user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

# Authentification par reconnaissance faciale
@app.post("/auth/face")
def authenticate_face(photo: UploadFile = File(...), db: Session = Depends(get_db)):
    # Sauvegarder la photo temporairement
    temp_path = os.path.join(UPLOAD_DIR, "temp_" + photo.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    # Encoder le visage de la photo reçue
    unknown_image = face_recognition.load_image_file(temp_path)
    unknown_encodings = face_recognition.face_encodings(unknown_image)
    if not unknown_encodings:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail="No face found on uploaded photo.")
    unknown_encoding = unknown_encodings[0]
    # Comparer avec tous les utilisateurs
    users = crud.get_users(db)
    for user in users:
        if os.path.exists(user.photo_path):
            known_image = face_recognition.load_image_file(user.photo_path)
            known_encodings = face_recognition.face_encodings(known_image)
            if known_encodings and face_recognition.compare_faces([known_encodings[0]], unknown_encoding)[0]:
                os.remove(temp_path)
                return {"authenticated": True, "user_id": user.id, "nom": user.nom}
    os.remove(temp_path)
    return {"authenticated": False}

app.mount("/photos", StaticFiles(directory=UPLOAD_DIR), name="photos")