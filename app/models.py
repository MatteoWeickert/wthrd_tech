from sqlalchemy import (
    Column, Integer, String, Boolean, BigInteger, JSON, ARRAY, Text, TIMESTAMP
)
from sqlalchemy.sql import func
from db import Base

class Item(Base):
    """
    Represents the 'items' table in the database.
    This model aligns with the table created by `init.sql`.
    Used for ORM-based interaction without managing table creation.
    """
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # REQUIRED: Model name
    architecture = Column(String(255), nullable=False)  # REQUIRED: Architecture name
    tasks = Column(ARRAY(Text), nullable=False)  # REQUIRED: List of tasks
    framework = Column(String(100), nullable=False)  # REQUIRED: Framework used
    framework_version = Column(String(50))  # Framework version
    memory_size = Column(BigInteger)  # Inference memory size in bytes
    total_parameters = Column(BigInteger)  # Total number of parameters
    pretrained = Column(Boolean, nullable=False, default=False)  # Pretrained or not
    pretrained_source = Column(Text)  # Source of pretraining
    batch_size_suggestion = Column(Integer)  # Suggested batch size
    accelerator = Column(String(100))  # Intended computational hardware
    accelerator_constrained = Column(Boolean, default=False)  # Accelerator-specific
    accelerator_summary = Column(Text)  # Accelerator description
    accelerator_count = Column(Integer)  # Number of accelerators required
    input = Column(JSON, nullable=False)  # REQUIRED: Input structure
    output = Column(JSON, nullable=False)  # REQUIRED: Output structure
    hyperparameters = Column(JSON)  # Model hyperparameters
    created_at = Column(TIMESTAMP, server_default=func.now())  # Auto-filled creation timestamp
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())  # Auto-updated timestamp