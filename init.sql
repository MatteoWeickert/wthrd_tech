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
    catalog_ID VARCHAR(50) REFERENCES catalogs(id),         -- Die ID des Katalogs, zu dem diese Collection gehört
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
    collection_id VARCHAR(50) REFERENCES collections(id),                               -- Die ID der Collection, auf die dieses Item verweist
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Erstellungsdatum des Items
    updated_at TIMESTAMPTZ DEFAULT NOW(),             -- Letztes Update des Items
    color VARCHAR(50) 
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    prename VARCHAR(20) NOT NULL,
    lastname VARCHAR(20) NOT NULL,
    email VARCHAR(30) NOT NULL,
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
    'Dies ist ein Katalog für Machine Learning Models (MLM).',
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
    '{"spatial": {"bbox": [[36.72418053653766, 36.04608406198559, -37.1751413641512, -29.414448517025097]]}, "temporal": {"interval": [["2022-01-01T00:00:00Z", "2022-12-31T23:59:59Z"]]}}', 
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
    '{"spatial": {"bbox": [[51.49732237251003, -56.43988855665618, -29.354629936450973, -113.66884303505508]]}, "temporal": {"interval": [["2023-01-01T00:00:00Z", "2023-12-31T23:59:59Z"]]}}', 
    (SELECT id FROM catalogs WHERE title = 'Example Catalog'), 
    NOW(), 
    NOW()
 );
-- Example data for items
INSERT INTO items (
    id, type, stac_version, stac_extensions, geometry, bbox, properties, 
    links, assets, collection_id, created_at, updated_at, color
)
VALUES (
    'forest_classification_landsat', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-122.0, 37.0], [-122.0, 38.0], [-121.0, 38.0], [-121.0, 37.0], [-122.0, 37.0]]]}',
    ARRAY[-122.0, 37.0, -121.0, 38.0]::double precision[],
    '{
        "start_datetime": "2020-01-01T00:00:00Z", "end_datetime": "2024-12-31T23:59:59Z", 
        "description": "Forest classification model using Landsat imagery",
        "mlm:framework": "tensorflow", "mlm:framework_version": "2.8.0",
        "file:size": 250000000, "mlm:memory_size": 2, "mlm:batch_size_suggestion": 16,
        "mlm:accelerator": "gpu", "mlm:accelerator_constrained": false,
        "mlm:accelerator_summary": "GPU recommended for optimal performance, but CPU inference is possible",
        "mlm:name": "Landsat Forest Classifier", 
        "mlm:architecture": "ResNet50 with custom head", 
        "mlm:tasks": ["image-classification", "land-cover"],
        "mlm:input": [{
            "name": "Landsat 8 Multispectral Image",
            "type": ["B2", "B3", "B4", "B5", "B6", "B7"],
            "input": {"shape": [-1, 6, 224, 224], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "standardization",
            "statistics": [{"mean": 0.406, "std": 0.225}, {"mean": 0.456, "std": 0.224}, {"mean": 0.485, "std": 0.229}, {"mean": 0.512, "std": 0.246}, {"mean": 0.532, "std": 0.241}, {"mean": 0.558, "std": 0.239}]
        }],
        "mlm:output": [{
            "name": "Forest Type Classification", "tasks": ["image-classification"],
            "result": {"shape": [-1, 4], "data_type": "float32"},
            "classification:classes": [
                {"value": 0, "name": "No Forest", "description": "Areas without significant tree cover"},
                {"value": 1, "name": "Deciduous", "description": "Deciduous forest"},
                {"value": 2, "name": "Coniferous", "description": "Coniferous forest"},
                {"value": 3, "name": "Mixed", "description": "Mixed forest types"}
            ]
        }],
        "mlm:total_parameters": 25000000, "mlm:pretrained": true,
        "mlm:pretrained_source": "ImageNet and custom Landsat dataset",
        "datetime": "2023-06-15T08:30:00Z"
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://landsat.gsfc.nasa.gov/data", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection_2/items/forest_classification_landsat", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection_2", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection_2", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://earth-ml-models/land-cover/forest-classification/landsat_forest_classifier_v1.0.h5",
            "type": "application/x-hdf5; application=tensorflow",
            "title": "Landsat Forest Classification Model",
            "description": "TensorFlow model for classifying forest types using Landsat 8 imagery",
            "mlm_artifact_type": "tensorflow.keras", "file:size": 250000000,
            "roles": ["mlm:model", "data"]
        },
        "documentation": {
            "href": "https://github.com/earth-ml/forest-classification/README.md",
            "type": "text/markdown",
            "title": "Model Documentation", 
            "description": "Usage instructions and methodology for the forest classification model",
            "roles": ["documentation"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    '2023-06-15T08:30:00Z'::timestamptz, 
    '2023-06-15T08:30:00Z'::timestamptz,
    '#2D9CDB'
),
(
    'crop_yield_prediction_sentinel', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[10.0, 50.0], [10.0, 52.0], [12.0, 52.0], [12.0, 50.0], [10.0, 50.0]]]}',
    ARRAY[10.0, 50.0, 12.0, 52.0]::double precision[],
    '{
        "start_datetime": "2022-01-01T00:00:00Z", "end_datetime": "2025-12-31T23:59:59Z", 
        "description": "Crop yield prediction model using Sentinel-2 time series data",
        "mlm:framework": "pytorch", "mlm:framework_version": "1.10.0",
        "file:size": 180000000, "mlm:memory_size": 1.5, "mlm:batch_size_suggestion": 32,
        "mlm:accelerator": "cpu", "mlm:accelerator_constrained": false,
        "mlm:accelerator_summary": "Designed for CPU inference, suitable for edge devices",
        "mlm:name": "Sentinel-2 Crop Yield Predictor", 
        "mlm:architecture": "LSTM with attention mechanism", 
        "mlm:tasks": ["regression", "time-series-forecasting"],
        "mlm:input": [{
            "name": "Sentinel-2 Time Series",
            "type": ["B2", "B3", "B4", "B8", "NDVI"],
            "input": {"shape": [-1, 24, 5], "dim_order": ["batch", "time_steps", "features"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max",
            "statistics": [{"minimum": 0, "maximum": 3000}, {"minimum": 0, "maximum": 3000}, {"minimum": 0, "maximum": 3000}, {"minimum": 0, "maximum": 10000}, {"minimum": -1, "maximum": 1}]
        }],
        "mlm:output": [{
            "name": "Predicted Yield", "tasks": ["regression"],
            "result": {"shape": [-1, 1], "data_type": "float32"},
            "units": "tons/hectare"
        }],
        "mlm:total_parameters": 15000000, "mlm:pretrained": true,
        "mlm:pretrained_source": "Historical Sentinel-2 data and ground truth yield data",
        "datetime": "2023-09-01T14:45:00Z"
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://scihub.copernicus.eu/", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection_2/items/crop_yield_prediction_sentinel", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection_2", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection_2", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://agri-ml-models/crop-yield/sentinel2_crop_yield_predictor_v2.1.pt",
            "type": "application/x-pytorch",
            "title": "Sentinel-2 Crop Yield Prediction Model",
            "description": "PyTorch model for predicting crop yield using Sentinel-2 time series data",
            "mlm_artifact_type": "torch.jit.script", "file:size": 180000000,
            "roles": ["mlm:model", "data"]
        },
        "sample_data": {
            "href": "https://github.com/agri-ml/crop-yield-prediction/sample_data.csv",
            "type": "text/csv",
            "title": "Sample Input Data", 
            "description": "Sample Sentinel-2 time series data for model testing",
            "roles": ["test"]
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection 2'), 
    '2023-09-01T14:45:00Z'::timestamptz, 
    '2023-09-01T14:45:00Z'::timestamptz,
    '#6FCF97'
), 
(
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
        "datetime": "2023-01-01T12:00:00Z"
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
'crop_yield_prediction_modis',
'Feature',
'1.0.0',
ARRAY[
'https://stac-extensions.github.io/file/v2.1.0/schema.json',
'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
]::text[],
'{"type": "Polygon", "coordinates": [[[-120.0, 30.0], [-120.0, 50.0], [-60.0, 50.0], [-60.0, 30.0], [-120.0, 30.0]]]}',
ARRAY[-120.0, 30.0, -60.0, 50.0]::double precision[],
'{
"start_datetime": "2020-01-01T00:00:00Z", "end_datetime": "2030-12-31T23:59:59Z",
"description": "Crop yield prediction model using MODIS time series data",
"mlm:framework": "tensorflow", "mlm:framework_version": "2.8.0",
"file:size": 250000000, "mlm:memory_size": 2, "mlm:batch_size_suggestion": 32,
"mlm:accelerator": "gpu", "mlm:accelerator_constrained": false,
"mlm:accelerator_summary": "GPU recommended for optimal performance, but CPU inference is possible",
"mlm:name": "MODIS Crop Yield Predictor",
"mlm:architecture": "LSTM with attention mechanism",
"mlm:tasks": ["regression", "time-series-forecasting"],
"mlm:input": [{
"name": "MODIS Time Series",
"type": ["NDVI", "EVI", "LST"],
"input": {"shape": [-1, 46, 3], "dim_order": ["batch", "time_steps", "features"], "data_type": "float32"},
"norm_by_channel": true, "norm_type": "standardization",
"statistics": [{"mean": 0.5, "std": 0.2}, {"mean": 0.4, "std": 0.15}, {"mean": 300, "std": 15}]
}],
"mlm:output": [{
"name": "Predicted Yield", "tasks": ["regression"],
"result": {"shape": [-1, 1], "data_type": "float32"},
"units": "bushels/acre"
}],
"mlm:total_parameters": 5000000, "mlm:pretrained": true,
"mlm:pretrained_source": "Historical MODIS data and USDA crop yield reports",
"datetime": "2025-01-15T10:30:00Z"
}',
ARRAY[
'{"rel": "derived_from", "href": "https://modis.gsfc.nasa.gov/data/", "type": "application/json"}',
'{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/crop_yield_prediction_modis", "type": "application/json"}',
'{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
'{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
'{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
]::jsonb[],
'{
"model": {
"href": "s3://agri-ml-models/crop-yield/modis_crop_yield_predictor_v1.2.h5",
"type": "application/x-hdf5; application=tensorflow",
"title": "MODIS Crop Yield Prediction Model",
"description": "TensorFlow model for predicting crop yield using MODIS time series data",
"mlm_artifact_type": "tensorflow.keras", "file:size": 250000000,
"roles": ["mlm:model", "data"]
},
"documentation": {
"href": "https://github.com/agri-ml/crop-yield-prediction/README.md",
"type": "text/markdown",
"title": "Model Documentation",
"description": "Usage instructions and methodology for the crop yield prediction model",
"roles": ["documentation"]
}
}'::jsonb,
(SELECT id FROM collections WHERE title = 'Example Collection'),
'2025-01-15T10:30:00Z'::timestamptz,
'2025-01-15T10:30:00Z'::timestamptz,
'#4A90E2'
),
(
'urban_change_detection_landsat',
'Feature',
'1.0.0',
ARRAY[
'https://stac-extensions.github.io/file/v2.1.0/schema.json',
'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
]::text[],
'{"type": "Polygon", "coordinates": [[[100.0, 0.0], [100.0, 10.0], [110.0, 10.0], [110.0, 0.0], [100.0, 0.0]]]}',
ARRAY[100.0, 0.0, 110.0, 10.0]::double precision[],
'{
"start_datetime": "2010-01-01T00:00:00Z", "end_datetime": "2030-12-31T23:59:59Z",
"description": "Urban change detection model using Landsat time series",
"mlm:framework": "pytorch", "mlm:framework_version": "1.11.0",
"file:size": 400000000, "mlm:memory_size": 3, "mlm:batch_size_suggestion": 8,
"mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
"mlm:accelerator_summary": "CUDA-enabled GPU required for efficient inference",
"mlm:name": "Landsat Urban Change Detector",
"mlm:architecture": "U-Net with temporal attention",
"mlm:tasks": ["change-detection", "semantic-segmentation"],
"mlm:input": [{
"name": "Landsat 8 Time Series",
"type": ["B2", "B3", "B4", "B5", "B6", "B7"],
"input": {"shape": [-1, 6, 5, 256, 256], "dim_order": ["batch", "time_steps", "channel", "height", "width"], "data_type": "float32"},
"norm_by_channel": true, "norm_type": "min-max",
"statistics": [{"minimum": 0, "maximum": 65535}, {"minimum": 0, "maximum": 65535}, {"minimum": 0, "maximum": 65535}, {"minimum": 0, "maximum": 65535}, {"minimum": 0, "maximum": 65535}, {"minimum": 0, "maximum": 65535}]
}],
"mlm:output": [{
"name": "Urban Change Map", "tasks": ["change-detection", "semantic-segmentation"],
"result": {"shape": [-1, 1, 256, 256], "data_type": "float32"},
"classification:classes": [
{"value": 0, "name": "No Change", "description": "No urban change detected"},
{"value": 1, "name": "Urban Expansion", "description": "New urban area detected"}
]
}],
"mlm:total_parameters": 50000000, "mlm:pretrained": true,
"mlm:pretrained_source": "Landsat 8 time series and manually labeled urban change maps",
"datetime": "2024-11-30T16:45:00Z"
}',
ARRAY[
'{"rel": "derived_from", "href": "https://www.usgs.gov/landsat-missions/landsat-8", "type": "application/json"}',
'{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/urban_change_detection_landsat", "type": "application/json"}',
'{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
'{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
'{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
]::jsonb[],
'{
"model": {
"href": "s3://urban-ml-models/change-detection/landsat_urban_change_detector_v2.0.pth",
"type": "application/x-pytorch",
"title": "Landsat Urban Change Detection Model",
"description": "PyTorch model for detecting urban changes using Landsat 8 time series",
"mlm_artifact_type": "torch.jit.script", "file:size": 400000000,
"roles": ["mlm:model", "data"]
},
"sample_data": {
"href": "https://github.com/urban-ml/change-detection/sample_data.zip",
"type": "application/zip",
"title": "Sample Input Data",
"description": "Sample Landsat 8 time series data for model testing",
"roles": ["test"]
}
}'::jsonb,
(SELECT id FROM collections WHERE title = 'Example Collection'),
'2024-11-30T16:45:00Z'::timestamptz,
'2024-11-30T16:45:00Z'::timestamptz,
'#BD10E0'
),
(
'forest_fire_risk_assessment',
'Feature',
'1.0.0',
ARRAY[
'https://stac-extensions.github.io/file/v2.1.0/schema.json',
'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
]::text[],
'{"type": "Polygon", "coordinates": [[[-125.0, 30.0], [-125.0, 50.0], [-100.0, 50.0], [-100.0, 30.0], [-125.0, 30.0]]]}',
ARRAY[-125.0, 30.0, -100.0, 50.0]::double precision[],
'{
"start_datetime": "2023-01-01T00:00:00Z", "end_datetime": "2030-12-31T23:59:59Z",
"description": "Forest fire risk assessment model using multi-source satellite data",
"mlm:framework": "scikit-learn", "mlm:framework_version": "1.0.2",
"file:size": 100000000, "mlm:memory_size": 1, "mlm:batch_size_suggestion": 64,
"mlm:accelerator": "cpu", "mlm:accelerator_constrained": false,
"mlm:accelerator_summary": "Designed for CPU inference, suitable for edge devices and cloud deployment",
"mlm:name": "Forest Fire Risk Predictor",
"mlm:architecture": "Random Forest Classifier",
"mlm:tasks": ["classification"],
"mlm:input": [{
"name": "Multi-source Satellite Data",
"type": ["NDVI", "LST", "Precipitation", "Wind Speed", "Relative Humidity"],
"input": {"shape": [-1, 5], "data_type": "float32"},
"norm_by_channel": true, "norm_type": "standardization",
"statistics": [
{"mean": 0.6, "std": 0.2},
{"mean": 300, "std": 10},
{"mean": 50, "std": 30},
{"mean": 5, "std": 2},
{"mean": 60, "std": 15}
]
}],
"mlm:output": [{
"name": "Fire Risk Level", "tasks": ["classification"],
"result": {"shape": [-1, 1], "data_type": "int32"},
"classification:classes": [
{"value": 0, "name": "Low Risk", "description": "Low probability of forest fire"},
{"value": 1, "name": "Medium Risk", "description": "Medium probability of forest fire"},
{"value": 2, "name": "High Risk", "description": "High probability of forest fire"},
{"value": 3, "name": "Extreme Risk", "description": "Extreme probability of forest fire"}
]
}],
"mlm:total_parameters": 500000, "mlm:pretrained": true,
"mlm:pretrained_source": "Historical satellite data and fire occurrence records",
"datetime": "2024-06-01T09:00:00Z"
}',
ARRAY[
'{"rel": "derived_from", "href": "https://firms.modaps.eosdis.nasa.gov/", "type": "application/json"}',
'{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/forest_fire_risk_assessment", "type": "application/json"}',
'{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
'{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
'{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
]::jsonb[],
'{
"model": {
"href": "s3://forest-ml-models/fire-risk/forest_fire_risk_predictor_v1.1.joblib",
"type": "application/octet-stream",
"title": "Forest Fire Risk Assessment Model",
"description": "Scikit-learn Random Forest model for predicting forest fire risk",
"mlm_artifact_type": "sklearn.ensemble.RandomForestClassifier", "file:size": 100000000,
"roles": ["mlm:model", "data"]
},
"documentation": {
"href": "https://github.com/forest-ml/fire-risk-assessment/docs/model_usage.pdf",
"type": "application/pdf",
"title": "Model Usage Guide",
"description": "Detailed guide on using the forest fire risk assessment model",
"roles": ["documentation"]
}
}'::jsonb,
(SELECT id FROM collections WHERE title = 'Example Collection'),
'2024-06-01T09:00:00Z'::timestamptz,
'2024-06-01T09:00:00Z'::timestamptz,
'#68838B'
),
(
    'solar_deeplearning_landsat', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[-120.0, 30.0], [-120.0, 45.0], [-100.0, 45.0], [-100.0, 30.0], [-120.0, 30.0]]]}',
    ARRAY[-120.0, 30.0, -100.0, 45.0]::double precision[],
    '{
        "start_datetime": "2020-01-01T00:00:00Z", "end_datetime": "2030-12-31T23:59:59Z", 
        "description": "Advanced solar farm detection using Landsat imagery",
        "mlm:framework": "pytorch", "mlm:framework_version": "2.2.1+cu118",
        "file:size": 280000000, "mlm:memory_size": 1.5, "mlm:batch_size_suggestion": 12,
        "mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
        "mlm:accelerator_summary": "GPU required for optimal performance with NVIDIA Turing or newer",
        "mlm:name": "Landsat Solar Farm Detector", 
        "mlm:architecture": "EfficientNet with Attention Mechanism", 
        "mlm:tasks": ["semantic-segmentation", "object-detection"],
        "mlm:input": [{
            "name": "Landsat 8 Multi-band Imagery",
            "type": ["B2", "B3", "B4", "B5", "B6", "B7"],
            "input": {"shape": [-1, 6, 512, 512], "dim_order": ["batch", "channel", "height", "width"], "data_type": "float32"},
            "norm_by_channel": true, "norm_type": "min-max"
        }],
        "mlm:output": [{
            "name": "Solar Farm Confidence", "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 512, 512], "data_type": "float32"},
            "classification:classes": [{"value": 1, "name": "Solar Farm", "description": "Detected Solar Installation"}]
        }],
        "mlm:total_parameters": 45000000, "mlm:pretrained": true,
        "mlm:pretrained_source": "Landsat 8 imagery and custom solar farm labels",
        "datetime": "2024-01-15T12:00:00Z"
    }',
    ARRAY[
        '{"rel": "derived_from", "href": "https://earthexplorer.usgs.gov/", "type": "application/json"}',
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_deeplearning_landsat", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection/", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://ml-models/solar-detection/landsat_solar_detector.pt",
            "type": "application/x-pytorch",
            "title": "Landsat Solar Farm Detection Model",
            "mlm_artifact_type": "torch.jit.script"
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#2D9CDB'
),
(
    'solar_uav_multispectral', 
    'Feature', 
    '1.0.0', 
    ARRAY[
        'https://stac-extensions.github.io/file/v2.1.0/schema.json',
        'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
    ]::text[],  
    '{"type": "Polygon", "coordinates": [[[10.0, 50.0], [10.0, 52.0], [12.0, 52.0], [12.0, 50.0], [10.0, 50.0]]]}',
    ARRAY[10.0, 50.0, 12.0, 52.0]::double precision[],
    '{
        "description": "Solar farm detection using UAV multispectral imagery",
        "mlm:framework": "tensorflow", "mlm:framework_version": "2.9.0",
        "mlm:name": "UAV Solar Farm Mapper", 
        "mlm:architecture": "DeepLab V3+ with ResNet Backbone", 
        "mlm:tasks": ["semantic-segmentation"],
        "mlm:input": [{
            "name": "UAV Multispectral Imagery",
            "type": ["RGB", "NIR", "RedEdge"],
            "input": {"shape": [-1, 5, 1024, 1024], "data_type": "float32"}
        }],
        "mlm:output": [{
            "name": "Solar Panel Segmentation", 
            "tasks": ["semantic-segmentation"],
            "result": {"shape": [-1, 1, 1024, 1024], "data_type": "float32"}
        }],
        "mlm:total_parameters": 35000000, "mlm:pretrained": true,
        "datetime": "2024-02-20T14:30:00Z"
    }',
    ARRAY[
        '{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_uav_multispectral", "type": "application/json"}',
        '{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection/", "type": "application/json"}',
        '{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
        '{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection/", "type": "application/json"}',
        '{"rel": "derived_from", "href": "https://de.wikipedia.org/wiki/Unbemanntes_Luftfahrzeug", "type": "application/json"}'
    ]::jsonb[], 
    '{
        "model": {
            "href": "s3://ml-models/solar-uav/multispectral_detector.h5",
            "type": "application/x-hdf5"
        }
    }'::jsonb, 
    (SELECT id FROM collections WHERE title = 'Example Collection'), 
    NOW(), 
    NOW(),
    '#F5A623'
),
(
'solar_satellite_timeseries',
'Feature',
'1.0.0',
ARRAY[
'https://stac-extensions.github.io/file/v2.1.0/schema.json',
'https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json'
]::text[],
'{"type": "Polygon", "coordinates": [[[-180.0, -90.0], [-180.0, 90.0], [180.0, 90.0], [180.0, -90.0], [-180.0, -90.0]]]}',
ARRAY[-180.0, -90.0, 180.0, 90.0]::double precision[],
'{
"start_datetime": "2015-01-01T00:00:00Z", "end_datetime": "2030-12-31T23:59:59Z",
"description": "Global solar farm detection using multi-year satellite imagery",
"mlm:framework": "pytorch", "mlm:framework_version": "2.0.0",
"file:size": 500000000, "mlm:memory_size": 4, "mlm:batch_size_suggestion": 4,
"mlm:accelerator": "cuda", "mlm:accelerator_constrained": true,
"mlm:accelerator_summary": "High-end NVIDIA GPU required due to model complexity and data volume",
"mlm:name": "Global Solar Farm Detector",
"mlm:architecture": "3D-UNet with Temporal Attention",
"mlm:tasks": ["semantic-segmentation", "change-detection"],
"mlm:input": [{
"name": "Multi-year Satellite Imagery",
"type": ["RGB", "NIR", "SWIR"],
"input": {"shape": [-1, 5, 12, 256, 256], "dim_order": ["batch", "channel", "time", "height", "width"], "data_type": "float32"},
"norm_by_channel": true, "norm_type": "min-max"
}],
"mlm:output": [{
"name": "Solar Farm Growth Map",
"tasks": ["semantic-segmentation", "change-detection"],
"result": {"shape": [-1, 2, 256, 256], "data_type": "float32"},
"classification:classes": [
{"value": 0, "name": "Non-Solar", "description": "Area not classified as solar farm"},
{"value": 1, "name": "Existing Solar", "description": "Existing solar farm installation"},
{"value": 2, "name": "New Solar", "description": "Newly detected solar farm installation"}
]
}],
"mlm:total_parameters": 120000000, "mlm:pretrained": true,
"mlm:pretrained_source": "Global satellite imagery time series and crowdsourced annotations",
"datetime": "2025-03-10T08:45:00Z"
}',
ARRAY[
'{"rel": "self", "href": "http://localhost:8000/collections/MLM_Collection/items/solar_satellite_timeseries", "type": "application/json"}',
'{"rel": "collection", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
'{"rel": "root", "href": "http://localhost:8000/", "type": "application/json"}',
'{"rel": "parent", "href": "http://localhost:8000/collections/MLM_Collection", "type": "application/json"}',
'{"rel": "derived_from", "href": "https://de.wikipedia.org/wiki/Zeitreihenanalyse", "type": "application/json"}'

]::jsonb[],
'{
"model": {
"href": "s3://ml-models/global-solar/timeseries_detector.pth",
"type": "application/x-pytorch",
"title": "Global Solar Farm Time Series Detector",
"mlm_artifact_type": "torch.jit.script"
}
}'::jsonb,
(SELECT id FROM collections WHERE title = 'Example Collection'),
NOW(),
NOW(),
'#7ED321'
)