CREATE TABLE catalogs (
    id VARCHAR(50) PRIMARY KEY,                          -- Eindeutige ID des Katalogs
    type TEXT NOT NULL CHECK (type = 'Catalog'),     -- Der Typ des Katalogs, sollte immer 'Catalog' sein
    stac_version TEXT NOT NULL,                      -- Die STAC-Version, die der Katalog implementiert
    stac_extensions TEXT[],                          -- Eine Liste von Erweiterungs-IDs, die der Katalog implementiert
    title TEXT,                                     -- Ein kurzer beschreibender Titel des Katalogs
    description TEXT NOT NULL,                      -- Eine detaillierte Beschreibung des Katalogs
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
    bbox DOUBLE PRECISION[],                                  -- Bounding Box des Items, wenn Geometrie nicht null ist
    properties JSONB NOT NULL,                       -- Ein JSONB-Objekt, das zusätzliche Metadaten enthält
    links JSONB[] NOT NULL,                           -- Eine Liste von Links (im JSON-Format)
    assets JSONB NOT NULL,                          -- Eine Karte von Asset-Objekten (im JSON-Format) (required: href)
    collection_ID VARCHAR(50) REFERENCES collections(id),                               -- Die ID der Collection, auf die dieses Item verweist
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Items
    updated_at TIMESTAMPTZ DEFAULT NOW(),             -- Letztes Update des Items
    color VARCHAR(50) 
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,                         
    username VARCHAR(50) NOT NULL,
    hashed_password VARCHAR(200) NOT NULL
);

-----------------------------------------------------------------------------------------------------------------------
-- Beispiel-Daten
-----------------------------------------------------------------------------------------------------------------------
-- Insert into `catalogs` table
INSERT INTO catalogs (id, type, stac_version, stac_extensions, title, description, created_at, updated_at)
VALUES (
    'Catalog for MLM', 
    'Catalog', 
    '1.0.0', 
    ARRAY['stac-core', 'extended'], 
    'Example Catalog', 
    'Dies ist ein Beispielkatalog für STAC-Daten.',
    NOW(), 
    NOW()
);

-- Insert into `collections` table
INSERT INTO collections (id, type, stac_version, stac_extensions, title, description, license, extent, catalog_ID, created_at, updated_at)
VALUES 
(
    'MLM_Collection',
    'Collection',
    '1.0.0',
    ARRAY[]::text[],
    'Example Collection', 
    'Eine Beispiel-Collection, die innerhalb des Beispielkatalogs enthalten ist.', 'CC BY 4.0', 
    '{"spatial": {"bbox": [[-180, -90, 180, 90]]}, "temporal": {"interval": [["2022-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]]}}', 
    (SELECT id FROM catalogs WHERE title = 'Example Catalog'), NOW(), NOW()
),
(
    'MLM_Collection_2', -- Neue eindeutige ID
    'Collection', 
    '1.0.0', 
    ARRAY[]::text[], 
    'Example Collection 2', -- Neuer Titel
    'Eine zweite Beispiel-Collection, die innerhalb desselben Beispielkatalogs enthalten ist.', -- Neue Beschreibung
    'CC BY 4.0', 
    '{"spatial": {"bbox": [[-180, -90, 180, 90]]}, "temporal": {"interval": [["2023-01-01T00:00:00Z", "2023-12-31T23:59:59Z"]]}}', 
    (SELECT id FROM catalogs WHERE title = 'Example Catalog'), 
    NOW(), 
    NOW()
 );
-- Example data for items
INSERT INTO items (
    id, type, stac_version, stac_extensions, geometry, bbox, properties, 
    links, assets, collection_ID, created_at, updated_at, color
)
VALUES (
    'solar_satlas_sentinel2', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#8B572A'
),
(
    'solar_satlas_sentinel2_2', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_2", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#F8E71C'
),
(
    'solar_satlas_sentinel2_3', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_3", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#D0021B'
),
(
    'solar_satlas_sentinel2_4', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_4", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#9013FE'
),
(
    'solar_satlas_sentinel2_5', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_5", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    NOW(), 
    NOW(),
    '#7ED321'
),
(
    'solar_satlas_sentinel2_6', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_6", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    NOW(), 
    NOW(),
    '#50E3C2'
),
(
    'solar_satlas_sentinel2_7', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_7", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    NOW(), 
    NOW(),
    '#F5A623'
),
(
    'solar_satlas_sentinel2_8', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-7.882190080512502, 37.13739173208318], [-7.882190080512502, 58.21798141355221], [27.911651652899923, 58.21798141355221], [27.911651652899923, 37.13739173208318], [-7.882190080512502, 37.13739173208318]]]}',
    ARRAY[-7.882190080512502, 37.13739173208318, 27.911651652899923, 58.21798141355221]::double precision[],
    '{
        "start_datetime": "1900-01-01T00:00:00Z", "end_datetime": "9999-01-01T00:00:00Z", 
        "description": "Sourced from satlas source code released by Allen AI under Apache 2.0",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.3.0+cu121",
        "file:size": 333000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 10,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "It is necessary to use GPU since it was compiled for NVIDIA Ampere and newer architectures with AOTInductor and the computational demands of the model.",
        "mlm:name": "Satlas Solar Farm Segmentation", 
        "mlm:architecture": "Swin Transformer V2 with U-Net head", 
        "mlm:tasks": ["semantic-segmentation", "segmentation"],
        "mlm:input": [{
            "name": "9 Band Sentinel-2 4 Time Step Series Batch",
            "type": ["B02", "B03", "B04", "B05", "B06", "B07", "B08", "B11", "B12"],
            "input": {"shape": [-1, 36, 1024, 1024], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max", "resize_type": "crop",
            "statistics": [{"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}, {"minimum": 0, "maximum": 255}],
            "pre_processing_function": {
                "format": "documentation-link", 
                "expression": "https://github.com/allenai/satlas/blob/main/CustomInference.md#sentinel-2-inference-example"
            }
        }],
        "mlm:output": [{
            "name": "confidence array", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "dim_order": ["batch", "height", "width"], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Solar Farm"}]
        }],
        "mlm:total_parameters": 89748193, "mlm:pretrained": true,
        "mlm:pretrained_source": "Sentinel-2 imagery and SATLAS labels",
        "datetime": null
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l1c", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satlas_sentinel2_8", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://wherobots-modelhub-prod/professional/semantic-segmentation/solar-satlas-sentinel2/inductor/gpu/aot_inductor_gpu_tensor_cores.zip",
            "type": "application/zip; application=pytorch",
            "title": "AOTInductor model exported from private, edited, hard fork of Satlas github repo.",
            "description": "A Swin Transformer backbone with a U-net head trained on the 9-band Sentinel-2 Top of Atmosphere product.",
            "mlm_artifact_type": "torch.jit.script", "file:size": 333000000,
            "roles": ["mlm:model", "data"]
        },
        "source_code": {
            "href": "https://github.com/wherobots/modelhub/blob/main/model-forge/satlas/solar/export.py",
            "type": "text/x-python",
            "title": "Model implementation.", 
            "description": "Source code to export the model.",
            "roles": ["mlm:model", "code"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    NOW(), 
    NOW(),
    '#4A90E2'
)