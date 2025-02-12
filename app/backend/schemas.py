# pydantic-file to check and create the data type of the inputs of POST and authentication routes 

from pydantic import BaseModel, Field, validator
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

# -----------------------------------
# Asset Model
# Represents an asset that can be linked to an item, such as images, documents, or other resources.
# -----------------------------------
class Asset(BaseModel):
    href: str = Field(..., description="URI to the asset object. Relative and absolute URIs are allowed.")
    title: Optional[str] = Field(None, description="Displayed title for clients and users.")
    description: Optional[str] = Field(None, description="A description of the Asset providing additional details.")
    type: Optional[str] = Field(None, description="Media type of the asset.")
    roles: Optional[List[str]] = Field(None, description="The semantic roles of the asset.")
    
    #verification of the "href"-attribute
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

    #verification of the "geometry"-attribute
    @validator("geometry")
    def validate_geometry(cls, value):
        """Validates that geometry has correct keys and format."""
        required_keys = {"type", "coordinates"}
        if not required_keys.issubset(value.keys()):
            raise ValueError("Geometry must have 'type' and 'coordinates' keys.")
        return value
    
    #verification of the "properties"-attribute
    @validator("properties")
    def validate_properties(cls, value):
        """Ensures required properties are present."""
        required_keys = ["datetime", "mlm:name", "mlm:architecture", "mlm:tasks", "mlm:input", "mlm:output"]
        missing_keys = [key for key in required_keys if key not in value]
        if missing_keys:
            raise ValueError(f"Missing properties: {', '.join(missing_keys)}.")
        return value
    
    #verification of the "colors"-attribute
    @validator("color")
    def validate_color(cls, value):
        """Validates that color follows the HEX format."""
        hex_pattern = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
        if not re.match(hex_pattern, value):
            raise ValueError("Invalid color format. Must be a HEX color code like #RRGGBB.")
        return value
    
    #verification of the "links"-attribute
    @validator("links")
    def validate_links(cls, value):
        if not isinstance(value, list):
            raise ValueError("'links' must be a list of objects.")

        for item in value:
            if not isinstance(item, dict):
                raise ValueError("Each item in 'links' must be an object (dict).")
            if 'href' not in item or 'rel' not in item:
                raise ValueError("Each object in 'links' must contain 'href' and 'rel' keys.")
            if not isinstance(item['href'], str):
                raise ValueError("The 'href' value in each object must be a string.")
            if not isinstance(item['rel'], str):
                raise ValueError("The 'rel' value in each object must be a string.")

        return value
    
    # function to convert the created asset-class into dictionaries
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

    #verification of the "title"-attribute
    @validator("title")
    def validate_title(cls, value):
        if not value or not value.strip():
            raise ValueError(f"The field '{cls.__name__}' must not be empty.")
        return value
    
    #verification of the "id"-attribute
    @validator("id")
    def validate_id(cls, value):
        if not value or not value.strip():
            raise ValueError("The id must be provided and cannot be empty.")
        return value
    
    #verification of the "description"-attribute
    @validator("description")
    def validate_description(cls, value):
        if not value or not value.strip():
            raise ValueError("The description must be provided and cannot be empty.")
        return value
    
    #verification of the "license"-attribute
    @validator("license")
    def validate_license(cls, value):
        if not value or not value.strip():
            raise ValueError("The license must be provided and cannot be empty.")
        return value
    
# definition of the expected User structure
class UserCreate(BaseModel):
    id: int
    username: str
    prename: str
    lastname: str
    email: str
    hashed_password: str  # Stores the hashed version of the user's password

# definition of the expected user request structure
class CreateUserRequest(BaseModel):
    """Handles user registration requests with plaintext password."""
    username: str
    prename: str
    lastname: str
    email: str
    password: str

# definition of the expected Token structure    
class Token(BaseModel):
    """Represents an authentication token for user sessions."""
    access_token: str
    token_type: str 