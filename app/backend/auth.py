from datetime import timedelta, datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from starlette import status
from db import SessionLocal
from models import User
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from schemas import CreateUserRequest, Token

# define router with new route /auth
router = APIRouter(
    prefix="/auth",
    tags=['auth']
)

# hashing secrets
SECRET_KEY = '901234803984309809809890bdf09vf9dvfd09v8df908v90fd8vf09v809f'
ALGORITHM = 'HS256'

# create OAuth2-Bearer
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token', auto_error=False)

# connect to the database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# route for creating a new user - beforehand: check if the username already exists
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):

    existing_user = db.query(User).filter(User.username == create_user_request.username).first()

    if existing_user:
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

    except IntegrityError: 
        db.rollback()  
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database integrity error.")
    
    return {"message": "User created successfully"}

    

# route for creating a token if the login (username and password match with the saved ones in db) was successful
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        return None

    token = create_access_token(user.username, user.id, timedelta(minutes=30))

    return {"access_token": token, "token_type": "bearer"}

# function to check if the provided password is the same as in the db and the user is registrated
def authenticate_user(username: str, password: str, db):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user

# function to create a token with a specific expiration date
def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id}
    expires = datetime.now() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

# function to identify the current user with his token to receive user data
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
        return None