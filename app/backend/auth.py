from datetime import timedelta, datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from starlette import status
from db import SessionLocal
from models import User
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from schemas import CreateUserRequest, Token

router = APIRouter(
    prefix="/auth",
    tags=['auth']
)

SECRET_KEY = '901234803984309809809890bdf09vf9dvfd09v8df908v90fd8vf09v809f'
ALGORITHM = 'HS256'

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token', auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):
    # Überprüfen, ob der Benutzername bereits existiert
    existing_user = db.query(User).filter(User.username == create_user_request.username).first()

    if existing_user:  # Falls ein Benutzer mit dem gleichen Benutzernamen existiert
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Username already used.")
    
    create_user_model = User(
        username = create_user_request.username,
        prename = create_user_request.prename,
        lastname = create_user_request.lastname,
        email = create_user_request.email,
        hashed_password = bcrypt_context.hash(create_user_request.password))

    try:
        db.add(create_user_model)
        db.commit()

    except IntegrityError:  # Falls die Datenbank eine Integritätsverletzung feststellt
        db.rollback()  # Änderungen zurücksetzen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database integrity error.")
    
    return {"message": "User created successfully"}

    

# Route zur Erstellung eines Tokens, wenn der Login (Eingegebener Username und Passwort stimmen mit DB überein) erfolgreich war
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        return None

    token = create_access_token(user.username, user.id, timedelta(minutes=30))

    return {"access_token": token, "token_type": "bearer"}


def authenticate_user(username: str, password: str, db):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id}
    expires = datetime.now() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Optional[str] = Depends(oauth2_bearer)) -> Optional[str]:

    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            return None
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        return {'id': user_id, 'username': username, 'prename': user.prename, 'lastname': user.lastname, 'email': user.email}
    
    except JWTError:
    # Token konnte nicht validiert werden
        return None