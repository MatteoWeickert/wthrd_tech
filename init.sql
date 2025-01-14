CREATE TABLE catalogs (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Katalogs
    type TEXT NOT NULL CHECK (type = 'Catalog'),     -- Der Typ des Katalogs, sollte immer 'Catalog' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die der Katalog implementiert
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die der Katalog implementiert
    title TEXT,                                     -- Ein kurzer beschreibender Titel des Katalogs
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung des Katalogs
    links JSONB[] NOT NULL,                           -- Eine Liste von Links (im JSON-Format)
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Katalogs
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update des Katalogs
);

CREATE TABLE collections (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID für die Collection
    type TEXT NOT NULL CHECK (type = 'Collection'),  -- Der Typ der Collection, sollte immer 'Collection' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die von dieser Collection implementiert wird
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die von dieser Collection implementiert werden
    title TEXT,                                     -- Ein kurzer beschreibender Titel der Collection
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung der Collection
    license TEXT NOT NULL,                          -- Lizenz der Daten-Collection als SPDX Lizenzbezeichner oder Ausdruck
    extent JSONB NOT NULL,                          -- Spatial und Temporal Extent (als JSON-Objekt)
    links JSONB[] NOT NULL,                           -- Eine Liste von Links (im JSON-Format)
    catalog_ID VARCHAR(50) REFERENCES catalogs(id),                                -- Die ID des Katalogs, zu dem diese Collection gehört
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum der Collection
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update der Collection
);

CREATE TABLE items (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Items
    type TEXT NOT NULL CHECK (type = 'Feature'),     -- Der GeoJSON-Typ des Items, sollte immer 'Feature' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die von diesem Item implementiert wird
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die von diesem Item implementiert werden
    geometry GEOMETRY,                              -- Geometrie des Items, als GeoJSON Geometry Objekt gespeichert
    bbox NUMERIC[],                                  -- Bounding Box des Items, wenn Geometrie nicht null ist
    properties JSONB NOT NULL,                       -- Ein JSONB-Objekt, das zusätzliche Metadaten enthält
    links JSONB[] NOT NULL,                           -- Eine Liste von Links (im JSON-Format)
    assets JSONB NOT NULL,                          -- Eine Karte von Asset-Objekten (im JSON-Format) (required: href)
    collection_ID VARCHAR(50) REFERENCES collections(id),                               -- Die ID der Collection, auf die dieses Item verweist
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Items
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Letztes Update des Items
);

-----------------------------------------------------------------------------------------------------------------------
-- Beispiel-Daten
-----------------------------------------------------------------------------------------------------------------------
-- Insert into `catalogs` table
INSERT INTO catalogs (id, type, stac_version, stac_extensions, title, description, links, created_at, updated_at)
VALUES (
    'Catalog for MLM', 
    'Catalog', 
    '1.0.0', 
    ARRAY['stac-core', 'extended'], 
    'Example Catalog', 
    'Dies ist ein Beispielkatalog für STAC-Daten.',
    ARRAY[
        {"href": "http://localhost:8000/", "type": "application/json", "rel": "self"}::jsonb,
        {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"}::jsonb,
        {"href": "http://localhost:8000/conformance", "type": "application/json", "rel": "conformance"}::jsonb,
        {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "data"}::jsonb], 
    NOW(), 
    NOW()
);

-- Insert into `collections` table
INSERT INTO collections (id, type, stac_version, stac_extensions, title, description, license, extent, links, catalog_ID, created_at, updated_at)
VALUES 
('MLM_Collection', 'Collection', '1.0.0', ARRAY['stac-core', 'extended'], 'Example Collection', 
 'Eine Beispiel-Collection, die innerhalb des Beispielkatalogs enthalten ist.', 'CC BY 4.0', 
 '{"spatial": {"bbox": [-180, -90, 180, 90]}, "temporal": {"interval": [["2022-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]]}}', 
 ARRAY[
    {"href": "https://example.com/collection", "type": "application/json", "rel": "self"}::jsonb,
    {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"}::jsonb,
    {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "parent"}::jsonb,
    {"href": "http://localhost:8000/collections/MLM_Collection/items", "type": "application/json", "rel": "items"}::jsonb,
    {"href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json", "rel": "child"}::jsonb
 ], 
 (SELECT id FROM catalogs WHERE title = 'Example Catalog'), NOW(), NOW());

-- Insert into `items` table with prefixed JSON keys
INSERT INTO items (id, type, stac_version, stac_extensions, geometry, bbox, properties, links, assets, collection_ID, created_at, updated_at)
VALUES 
(
    'example_model', 
    'Feature', 
    '1.0.0', 
    ARRAY['stac-core'], 
    'SRID=4326;POINT(10 10)', 
    ARRAY[-10.0, -10.0, 10.0, 10.0],  -- Werte müssen in der Reihenfolge [west, south, east, north] sein
    '{
        "title": "Example Item",
        "description": "Dies ist ein Beispiel-Item innerhalb der Example Collection.",
        "datetime": "2024-12-04T16:20:00",
        "mlm:name": "Example Model",
        "mlm:architecture": "ResNet50",
        "mlm:tasks": ["classification", "image"],
        "mlm:framework": "TensorFlow",
        "mlm:framework_version": "2.7",
        "mlm:memory_size": 1200000000,
        "mlm:total_parameters": 25000000,
        "mlm:pretrained": true,
        "mlm:pretrained_source": "ImageNet",
        "mlm:batch_size_suggestion": 32,
        "mlm:accelerator": "GPU",
        "mlm:accelerator_constrained": false,
        "mlm:accelerator_summary": "NVIDIA Tesla V100",
        "mlm:accelerator_count": 2,
        "mlm:input": {
            "type": "image",
            "shape": [224, 224, 3]
        },
        "mlm:output": {
            "type": "class",
            "num_classes": 1000
        },
        "mlm:hyperparameters": {
            "learning_rate": 0.001,
            "dropout": 0.5
        }
    }', 
    ARRAY[
        {"href": "https://example.com/item", "type": "application/json", "rel": "self"}::jsonb,
        {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "parent"}::jsonb,
        {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"}::jsonb,
        {"href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json", "rel": "collection"}::jsonb
    ], 
    '{
        "thumbnail": {
            "href": "https://example.com/thumbnail.png"
        },
        "data": {
            "href": "https://example.com/data"
        }
    }', 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW()
),
(
    'advanced_model', 
    'Feature', 
    '1.0.0', 
    ARRAY['stac-core'], 
    'SRID=4326;POINT(20 20)', 
    ARRAY[15, 15, 25, 25], 
    '{
        "title": "Advanced Item",
        "description": "Ein fortgeschrittenes Beispiel-Item innerhalb der Example Collection.",
        "datetime": "2024-12-05T12:00:00",
        "mlm:name": "Advanced Model",
        "mlm:architecture": "Transformer",
        "mlm:tasks": ["natural language processing"],
        "mlm:framework": "PyTorch",
        "mlm:framework_version": "1.11",
        "mlm:memory_size": 8000000000,
        "mlm:total_parameters": 500000000,
        "mlm:pretrained": true,
        "mlm:pretrained_source": "HuggingFace",
        "mlm:batch_size_suggestion": 16,
        "mlm:accelerator": "TPU",
        "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "Google TPU v3",
        "mlm:accelerator_count": 4,
        "mlm:input": {
            "type": "text",
            "max_length": 512
        },
        "mlm:output": {
            "type": "text",
            "num_tokens": 128
        },
        "mlm:hyperparameters": {
            "learning_rate": 0.0001,
            "dropout": 0.1
        }
    }', 
    ARRAY[
        {"href": "https://example.com/advanced_item", "type": "application/json", "rel": "self"}::jsonb,
        {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "parent"}::jsonb,
        {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"}::jsonb,
        {"href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json", "rel": "collection"}::jsonb
    ], 
    '{
        "thumbnail": {
            "href": "https://example.com/advanced_thumbnail.png"
        },
        "data": {
            "href": "https://example.com/advanced_data"
        }
    }', 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW()
),
(
    'basic_model', 
    'Feature', 
    '1.0.0', 
    ARRAY['stac-core'], 
    'SRID=4326;POINT(5 5)', 
    ARRAY[0, 0, 10, 10], 
    '{
        "title": "Basic Item",
        "description": "Ein einfaches Beispiel-Item innerhalb der Example Collection.",
        "datetime": "2024-12-06T08:30:00",
        "mlm:name": "Basic Model",
        "mlm:architecture": "Linear Model",
        "mlm:tasks": ["regression"],
        "mlm:framework": "Scikit-Learn",
        "mlm:framework_version": "1.0",
        "mlm:memory_size": 20000000,
        "mlm:total_parameters": 1000,
        "mlm:pretrained": false,
        "mlm:batch_size_suggestion": 64,
        "mlm:accelerator": "CPU",
        "mlm:accelerator_constrained": false,
        "mlm:input": {
            "type": "numerical",
            "shape": [10]
        },
        "mlm:output": {
            "type": "numerical",
            "shape": [1]
        },
        "mlm:hyperparameters": {
            "learning_rate": 0.01
        }
    }', 
    ARRAY[
        {"href": "https://example.com/basic_item", "type": "application/json", "rel": "self"}::jsonb,
        {"href": "http://localhost:8000/collections", "type": "application/json", "rel": "parent"}::jsonb,
        {"href": "http://localhost:8000/", "type": "application/json", "rel": "root"}::jsonb,
        {"href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json", "rel": "collection"}::jsonb
    ], 
    '{
        "thumbnail": {
            "href": "https://example.com/basic_thumbnail.png"
        },
        "data": {
            "href": "https://example.com/basic_data"
        }
    }', 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW()
);
