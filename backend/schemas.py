from pydantic import BaseModel

class UserBase(BaseModel):
    nom: str
    etablissement: str

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int
    photo_path: str
    class Config:
        orm_mode = True