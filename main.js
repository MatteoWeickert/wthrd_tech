// Fassadenfunktion welche alle zum Start benötigten Funktionen ausführt
function startWebsite(){
    fetchItems();
    addItems();
    createInputForm(['Name', 'Beschreibung', 'Architektur', 'Aufgaben', 'Eingabe', 'Ausgabe', 'Links', 'Assets']);
}
startWebsite();

// Fetchen aller Modelle
async function fetchItems() {
    try {
        const response = await fetch('http://localhost:8000/items');
        if (!response.ok) {
            showAlert(4, "Fehler beim verbinden zum STAC.", "Überprüfe die Netzwerkverbindung.")
        }
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            displayItems(data, undefined);
            console.log(printAllFilters(data));
        } else {
            showAlert(4, "Fehler beim Abrufen der Items.", "Überprüfe die Netzwerkverbindung.")
        }
    } catch (error) {
        showAlert(4, "Fehler beim Abrufen der Items oder bei der Verbindung zum STAC.", "Überprüfe die Netzwerkverbindung.")
    }
}

// addItems
async function addItems(){
    try {
        const response = await fetch('http://localhost:8000/addItem/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gtInputForm())
         });
         const data = await response.json();
         console.log("to add:" + data);
       } catch(error) {
          showAlert(4, "Item konnte nicht hinzugefügt werden.", "")
         } 
}

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: false,
    circlemarker: false,
    rectangle: true
  },
  edit: {
    featureGroup: drawnItems,
    remove: true
  }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);
    const bounds = layer.getBounds();
    getBounds(bounds);
});

function getBounds(data){
    console.log(data.toBBoxString());
}

// Funktion welche die Inputfenster automatisch entsprechend der Anforderungen erstellt
function createInputForm(data) {
    console.log("1");
    const parameters = data;
    const container = document.getElementById('main-inputcontainer');
    createInputScrollBar(data);
    container.innerHTML = '';

    parameters.forEach(parameter => {
        console.log("2", parameter);
        container.innerHTML += `
            <div id="main-inputgroup" class="d-flex align-items-center justify-content-between w-100">
                <div id="inputexp-${parameter}" class="main-inputexp">
                    ${parameter}
                </div>
                <div id="main-inputelem" class="flex-grow-1 d-flex justify-content-center">
                    <input id="input-${parameter}" class="main-inputwindow" />
                </div>
                <div id="" class="main-inputalert"></div>
            </div>
        `;
    });

    // BoundingBox Option hinzufügen
    container.innerHTML += `
                                    <div id="main-inputgroup" class="d-flex align-items-center justify-content-between w-100">
                                    <div id="inputexp-map" class="main-inputexp">
                                        Bounding Box
                                    </div>
                                    <div id="main-inputelem" class="flex-grow-1 justify-content-center">
                                        <div id="map" class="h-100 w-50"></div>
                                    </div>
                                    <div id="" class="main-inputalert"></div>
                                </div>

    `
    // Colorcode Option hinzufügen
    container.innerHTML += `
                                    <div id="main-inputgroup" class="d-flex align-items-center justify-content-between w-100">
                                    <div id="inputexp-color" class="main-inputexp">
                                        Farbgebung
                                    </div>
                                    <div id="main-inputelem" class="flex-grow-1 justify-content-center">
                                        <input id="main-inputelem-color" style="height: 30px;"class="w-50" type="color" />
                                    </div>
                                    <div id="" class="main-inputalert"></div>
                                </div>

    `
}

// Funktion um ausgewählte Farbe beim hinzufügen eines Modells zu sichern
function getSelectedColor(){
    const colorInput = document.getElementById('main-inputelem-color');
    colorInput.addEventListener('input', function() {
        const selectedColor = colorInput.value;
        return selectedColor
    });
}

// Funktion zum dynamischen Erstellen des Inhaltsverzeichnisses mit Scrollfunktion
function createInputScrollBar(data) {
    const parameters = data;
    const sidebar = document.getElementById("sidebar");
    const sidebarList = sidebar.querySelector(".nav.flex-column");
    
    // Titel hinzufügen
    sidebarList.innerHTML = `                        
        <h6 id="sidebar-groupheader" class="sidebar-heading d-flex align-items-center mt-4 mb-1 text-muted">
            <span>Inhaltsverzeichnis</span>
        </h6><hr>`;
    
    // Dynamisch alle Parameter hinzufügen
    parameters.forEach(parameter => {
        sidebarList.innerHTML += `
            <li class="nav-item">
                <a class="nav-link" href="#inputexp-${parameter}">${parameter}</a>
            </li>
        `;
    });
    
    // Feststehende Elemente hinzufügen
    sidebarList.innerHTML += `
    <li class="nav-item">
        <a class="nav-link" href="#inputexp-map">Bounding Box</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="#inputexp-color">Farbgebung</a>
    </li>
    `;
    
    // Footer hinzufügen
    sidebarList.innerHTML += ` 
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <li class="nav-item">
                <a id="sidebar-footerlink" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal" href="#">
                    Login
                </a>
            </li>
            <li class="nav-item">
                <a id="sidebar-footerlink" class="nav-link" href="#">
                    Settings
                </a>
            </li>
        </div>`;
}



// Testfunktion um Items hinzuzufügen
function getInputForm(){
        const item = {
            "id": "item-67890",
            "type": "Feature",
            "stac_version": "1.0.0",
            "stac_extensions": [
                "https://stac-extensions.github.io/eo/v1.0.0/schema.json",
                "https://stac-extensions.github.io/scientific/v1.0.0/schema.json"
            ],
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [12.4924, 41.8902],
                        [12.4934, 41.8902],
                        [12.4934, 41.8912],
                        [12.4924, 41.8912],
                        [12.4924, 41.8902]
                    ]
                ]
            },
            "bbox": [12.4924, 41.8902, 12.4934, 41.8912],
            "properties": {
                "datetime": "2025-01-01T12:00:00Z",
                "mlm:name": "Sample Model",
                "mlm:architecture": "EfficientNet-B0",
                "mlm:tasks": "Image Segmentation",
                "mlm:input": "Satellite Imagery",
                "mlm:output": "Land Use Classes",
                "mlm:color": "#FF5733",
                "title": "Example STAC Item",
                "description": "This item represents a demonstration of STAC metadata."
            },
            "links": {
                "self": {
                    "href": "https://example.com/items/item-67890",
                    "rel": "self",
                    "type": "application/json"
                },
                "collection": {
                    "href": "https://example.com/collections/collection-456",
                    "rel": "collection",
                    "type": "application/json"
                }
            },
            "assets": {
                "thumbnail": {
                    "href": "https://example.com/thumbnails/item-67890.png",
                    "type": "image/png",
                    "title": "Thumbnail Image"
                },
                "data": {
                    "href": "https://example.com/data/item-67890.tif",
                    "type": "image/tiff",
                    "title": "Data Asset"
                }
            },
            "collection_id": "Example_Collection",
            "created_at": "2025-01-01T12:00:00Z",
            "updated_at": "2025-01-01T12:00:00Z"
        }
 return item;       
}

// Funktion zum anzeigen aller verfügbaren unique Filtervalues in der Sidebar
function printAllFilters(items) {
    const filters = extractUniqueFilterValues(items);
    let filterContent = '';
    const sidebar = document.getElementById("sidebar");

    sidebar.innerHTML = ''; // Vorherige Inhalte der Sidebar löschen

    const toggleButton = `
        <button class="d-md-none position-absolute top-0 end-0 m-2 btn btn-link p-0" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar" aria-controls="sidebar" aria-expanded="false" aria-label="Toggle Sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-x-lg" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
        </button>
    `;

    let selectedFilters = []; // Zur Speicherung der ausgewählten Filter

    Object.keys(filters).forEach(group => {
        let options = '';
        filters[group].forEach(option => {
            const optionId = `filter-${group}-${option.replace(/[^a-zA-Z0-9-_]/g, '')}`;
            options += `
                <div class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" id="${optionId}" value="${option}" data-group="${group}">
                    <label class="form-check-label" for="${optionId}">${option}</label>
                </div>
            `;
        });

        filterContent += `
            <span id="sidebar-groupheader" class="sidebar-heading d-flex mt-3 align-items-center">
                <span>${group}</span>
            </span>
            <div class="d-flex flex-wrap">
                ${options}
            </div>
        `;
    });

    const footer = `
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <a id="sidebar-footerlink" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>
            <a id="sidebar-footerlink" href="#" class="nav-link">Settings</a>
        </div>
    `;

    sidebar.innerHTML = toggleButton + filterContent + footer;

    const checkboxes = sidebar.querySelectorAll('.form-check-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const group = checkbox.dataset.group;
            const value = checkbox.value;

            if (checkbox.checked) {
                if (!selectedFilters[group]) {
                    selectedFilters[group] = [];
                }
                if (!selectedFilters[group].includes(value)) {
                    selectedFilters[group].push(value);
                }
            } else {
                if (selectedFilters[group]) {
                    selectedFilters[group] = selectedFilters[group].filter(item => item !== value);
                    if (selectedFilters[group].length === 0) {
                        delete selectedFilters[group];
                    }
                }
            }

            displayItems(items, selectedFilters);
        });
    });
}

// Items anhand der angekreuzten Filterparameter filtern
function filterItems(items, filters){
    showAlert(0)
    let selectedItems = [];
    let matchingValues = true;
    if(!filters || Object.keys(filters).length === 0){
        return items
    }
    else{
        items.forEach( item=> {
            try{
                //Framework filtern
                if(filters.frameworks && Object.keys(filters.frameworks).length > 0){
                    //console.log("frameworks")
                    if(item.properties['mlm:framework'].includes(filters.frameworks)){
                        // console.log("frameworks accessed")
                        matchingValues = true;
                    }
                    else{
                        return;
                    }
                }
                //Accelerators filtern
                if(filters.accelerators && Object.keys(filters.accelerators).length > 0){
                    //console.log("accelerator")
                    if(item.properties['mlm:accelerator'].includes(filters.accelerators)){
                        //console.log("accelerator accessed")
                        matchingValues = true;
                    }
                    else{
                        return;
                    }
                }
                // Tasks filtern
                if (filters.tasks && Object.keys(filters.tasks).length > 0){
                    // console.log("tasks")
                    // console.log(JSON.stringify(filters.tasks))
                    // console.log(JSON.stringify(item.properties['mlm:tasks']))
                    if (Array.from(item.properties['mlm:tasks']).some(task => filters.tasks.includes(task))) {
                        //console.log("tasks accessed")
                        matchingValues = true;
                    } else {
                        return;
                    }
                }
                //Inputs filtern
                if(filters.inputTypes && Object.keys(filters.inputTypes).length > 0){
                    // console.log("input")
                    // console.log(item.properties['mlm:input'].type.includes(filters.inputTypes))
                    if(item.properties['mlm:input'].type.includes(filters.inputTypes)){
                        // console.log("input accessed")
                        matchingValues = true;
                    }
                    else{
                        return;
                    }
                }

                // Pretrained Sources
                if (filters.pretrainedSources && item.properties['mlm:pretrained_source'] !== 'None' && Array.isArray(filters.pretrainedSources) && filters.pretrainedSources.length > 0) {
                    if (filters.pretrainedSources.includes(item.properties['mlm:pretrained_source'])) {
                        // console.log("Pretrained sources accessed");
                        matchingValues = true;
                    } else {
                        return;
                    }
                }

                // Accelerator Summary filtern
                if (filters.acceleratorSummaries && item.properties['mlm:accelerator_summary'] !== 'None' && Array.isArray(filters.acceleratorSummaries) && filters.acceleratorSummaries.length > 0) {
                    // console.log(filters.acceleratorSummaries);
                    // console.log(item.properties['mlm:accelerator_summary']);
                    if (filters.acceleratorSummaries.includes(item.properties['mlm:accelerator_summary'])) {
                        // console.log("Accelerator summary accessed");
                        matchingValues = true;
                    } else {
                        return;
                    }
                }
                if(matchingValues){
                    selectedItems.push(item)
                }
            }
            catch (error){
                showAlert(1, "Nicht alle Modelle wurden betrachtet. Fehlerhaftes Modell: ", item.id)
                return;
            }
        });
        if(Object.keys(selectedItems).length == 0){
            showAlert(2, "Keine Modelle gefunden.", "Nutze andere Suchparameter oder füge ein weiteres Modell mit deinen Anforderungen hinzu.")
        }
        console.log(selectedItems);
        return selectedItems;
    }
}

// Funktion zum Anzeigen aller Modelle
function displayItems(items, filters) {
    const container = document.getElementById('modell-container');
    container.innerHTML = '';
    const selectedFilters = filters;
    const filteredItems = filterItems(items, filters);

    filteredItems.forEach(item => { 
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('p-3', 'modell-item');

                const title = document.createElement('span');
                title.innerHTML = `${item.properties.title || 'Unbekannter Titel'}`;

                const parameters = document.createElement('div');
                parameters.classList.add('modell-itemparameter');
                parameters.id = `modell-itemparameter-${item.id}`;
                parameters.innerHTML = `
                    ${fillInParameters(item)}
                    <button type="button" 
                            class="btn-expand" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#collapse-${item.id}" 
                            aria-expanded="false" 
                            aria-controls="collapse-${item.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-down" viewBox="0 0 16 16">
                                <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659"/>
                            </svg>
                    </button>
                `;

                const information = document.createElement('div');
                information.id = 'modell-itemcollapse'
                information.innerHTML = `
                    <div class="collapse" id="collapse-${item.id}">
                        <div class="card card-body">
                            <div class="card-body-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-braces" viewBox="0 0 16 16">
                                    <path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6"/>
                                </svg>
                                <span style="font-size: 10px;">${item.properties['mlm:name']} /   </span><span style="font-size:20px;">${item.properties.title}</span>
                                <img src="${item.assets.data['thumbnail']}" width="10px" height="10px" alt="" />
                            </div>
                            <hr>
                            <span style="font-size:15px;">Beschreibung:</span>
                            <span style="font-size:12px;">${item.properties.description}</span>
                            <hr>
                            <div class="card-body-download">
                                <span style="font-size:15px;">Einbinden:</span><br> <span style="font-size:12px;">${item.assets.data['href']}</span>
                                    <button type="button" class="btn-clipboard" onclick="copyToClipboard('${item.assets.data['href']}', '${item.properties['mlm:name']}')" id="clipboard-${item.id}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#414243" class="bi bi-clipboard" viewBox="0 0 16 16">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                                        </svg>
                                    </button>
                            </div>
                            <hr>
                            <div style="font-size:12px;"class="card-body-parameters">
                                <span>Tasks: ${item.properties['mlm:accelerator'] || 'Unbekannt'} </span><br>
                                <span>Modell: ${item.properties['mlm:tasks']}</span><br>
                                <span>Framework: ${item.properties['mlm:framework'] || 'Unbekannt'} </span><br>
                                <span>Link: ${item.assets.data['href'] || 'Unbekannt'} </span>
                                <hr>
                            </div>
                            <span style="font-size:10px;">Letztes Update: ${item['updated_at'] || 'Unbekannt'} </span>
                        </div>
                    </div>
                `;

                itemDiv.appendChild(title);
                itemDiv.appendChild(parameters);
                itemDiv.appendChild(information);
                container.appendChild(itemDiv);
        });
}

// Funktion zum kopieren von Informationen in die Zwischenablage
function copyToClipboard(url_text, model_name) {
    //console.log("reached");
    navigator.clipboard.writeText(url_text).then(() => {
        showAlert(2, `Link des Modells <i>${model_name}</i> erfolgreich in die Zwischenablage kopiert.`, "");
    }).catch(err => {
        showAlert(1, `Link des Modells ${model_name} konnte nicht kopiert werden.`, "");
    });
}

// Funktion um anzuzeigende Informationen zu den Modellen zu generieren
function fillInParameters(item, filters){

        return `           <span>
                    ${item.properties['mlm:accelerator'] || 'Unbekannt'} - 
                    ${item.properties['mlm:framework'] || 'Unbekannt'} - 
                    ${item.properties['mlm:accelerator_summary'] || 'Unbekannt'}
                </span>` 

}

// Funktion zum erstellen von dynmaischen Clean 0 Alerts 1 Warnung 2 Info 3 Erfolg 4 Error
function showAlert(type, text, optional){
    alertContainer = document.getElementById('main-alert')
    switch(type){
        case(0): // CLEAN
            alertContainer.innerHTML = ``
        break;
        case(1): // WARNING
            alertContainer.innerHTML = `                            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                                <strong>Warnung:</strong> ${text} <i> ${optional} </i>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>`
        break;
        case(2): // INFO
            alertContainer.innerHTML =`                            <div class="alert alert-primary alert-dismissible fade show" role="alert">
                                <strong>Info:</strong> ${text} ${optional}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>`
        break;
        case(3): // ERFOLG
            alertContainer.innerHTML =`                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <strong>Erfolgreich:</strong> ${text} ${optional}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>`
        break;
        case(4): // ERROR
            alertContainer.innerHTML =`                            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                <strong>Fehler:</strong> ${text} ${optional}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>`
        break;
    }
}

// Funktion um einzigartige Werte aus Items zu extrahieren
function extractUniqueFilterValues(items) {
    const filters = {
        tasks: new Set(),
        frameworks: new Set(),
        inputTypes: new Set(),
        accelerators: new Set(),
        pretrainedSources: new Set(),
        acceleratorSummaries: new Set(),
        bboxes: new Set()
    };

    items.forEach(item => {
        const properties = item.properties;

        if (properties['mlm:tasks']) {
            properties['mlm:tasks'].forEach(task => filters.tasks.add(task));
        }

        if (properties['mlm:framework']) {
            filters.frameworks.add(properties['mlm:framework']);
        }

        if (properties['mlm:input']?.type) {
            filters.inputTypes.add(properties['mlm:input'].type);
        }

        if (properties['mlm:accelerator']) {
            filters.accelerators.add(properties['mlm:accelerator']);
        }

        if (properties['mlm:pretrained_source']) {
            filters.pretrainedSources.add(properties['mlm:pretrained_source']);
        }

        if (properties['mlm:accelerator_summary']) {
            filters.acceleratorSummaries.add(properties['mlm:accelerator_summary']);
        }

        if (item.bbox) {
            filters.bboxes.add(JSON.stringify(item.bbox));
        }
    });

    return {
        tasks: Array.from(filters.tasks),
        frameworks: Array.from(filters.frameworks),
        inputTypes: Array.from(filters.inputTypes),
        accelerators: Array.from(filters.accelerators),
        pretrainedSources: Array.from(filters.pretrainedSources),
        acceleratorSummaries: Array.from(filters.acceleratorSummaries),
    };
}