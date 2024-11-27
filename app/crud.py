from sqlalchemy.orm import Session
from models import Item

def get_items(db: Session):
    return db.query(Item).all()

def add_item(db: Session, item_data: dict):
    new_item = Item(**item_data)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)