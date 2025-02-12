from pydantic import BaseModel, Field, validator
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

# -----------------------------------
# Asset Model
# Represents an asset that can be linked to an item, such as images, documents, or other resources.
# -----------------------------------
class Asset(BaseModel):
    href: str  # URI to the asset
    title: Optional[str]
    description: Optional[str]
    type: Optional[str]
    roles: Optional[List[str]]

    @validator("href")
    def validate_href(cls, value):
        """Ensures 'href' is a non-empty string."""
        if not isinstance(value, str) or not value.strip():
            raise ValueError("The 'href' field must be a non-empty string.")
        return value

    def to_dict(self):
        """Converts the Asset object to a dictionary."""
        return self.dict()

# -----------------------------------
# ItemCreate Model
# Defines the structure for creating an item in the database, including metadata, geometry, and assets.
# -----------------------------------
class ItemCreate(BaseModel):
    id: str
    type: str = Field("Feature", const=True)  # Must always be "Feature"
    stac_version: str
    stac_extensions: List[str]
    geometry: Dict[str, Any]  # Stores spatial data
    bbox: List[float]  # Defines bounding box coordinates
    properties: Dict[str, Any]  # Contains metadata about the item
    links: List[Dict]  # Stores related links
    assets: Dict[str, Asset]  # Dictionary of downloadable assets
    collection_id: str
    created_at: datetime
    updated_at: datetime
    color: str  # HEX color code

    @validator("geometry")
    def validate_geometry(cls, value):
        """Validates that geometry has correct keys and format."""
        required_keys = {"type", "coordinates"}
        if not required_keys.issubset(value.keys()):
            raise ValueError("Geometry must have 'type' and 'coordinates' keys.")
        return value

    @validator("properties")
    def validate_properties(cls, value):
        """Ensures required properties are present."""
        required_keys = ["datetime", "mlm:name", "mlm:architecture", "mlm:tasks", "mlm:input", "mlm:output"]
        missing_keys = [key for key in required_keys if key not in value]
        if missing_keys:
            raise ValueError(f"Missing properties: {', '.join(missing_keys)}.")
        return value

    @validator("color")
    def validate_color(cls, value):
        """Validates that color follows the HEX format."""
        hex_pattern = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
        if not re.match(hex_pattern, value):
            raise ValueError("Invalid color format. Must be a HEX color code like #RRGGBB.")
        return value

    def dict(self, *args, **kwargs):
        """Overrides the default dictionary method to serialize assets."""
        obj_dict = super().dict(*args, **kwargs)
        obj_dict["assets"] = {key: asset.to_dict() for key, asset in self.assets.items()}
        return obj_dict

# -----------------------------------
# CollectionCreate Model
# Represents a collection of items with metadata, extent, and accessibility settings.
# -----------------------------------
class CollectionCreate(BaseModel):
    id: str
    type: str = Field("Collection", const=True)  # Must always be "Collection"
    stac_version: str
    stac_extensions: List[str]
    title: str
    description: str
    license: str
    extent: Dict  # Defines spatial and temporal extent
    catalog_id: str
    created_at: datetime
    updated_at: datetime
    ispublic: bool  # Determines if the collection is publicly accessible

    @validator("title", "id", "description", "license")
    def validate_non_empty(cls, value):
        """Ensures required fields are not empty."""
        if not value or not value.strip():
            raise ValueError(f"The field '{cls.__name__}' must not be empty.")
        return value

# -----------------------------------
# User and Authentication Models
# Used for user creation and authentication processes.
# -----------------------------------
class UserCreate(BaseModel):
    id: int
    username: str
    prename: str
    lastname: str
    email: str
    hashed_password: str  # Stores the hashed version of the user's password

class CreateUserRequest(BaseModel):
    """Handles user registration requests with plaintext password."""
    username: str
    prename: str
    lastname: str
    email: str
    password: str  # Plaintext password (will be hashed before storage)

class Token(BaseModel):
    """Represents an authentication token for user sessions."""
    access_token: str
    token_type: str  # Defines the token type (e.g., Bearer)
