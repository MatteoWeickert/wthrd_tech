let sharedDrawnItems = null;
let bboxString = null;
let selectedFilters = {};
let usedFilters= null;
let lastSearchedBbox= null;

let startDatum = null;
let endDatum = null;
let allItems = [];
let allCollections = [];

// Singleton-Fkt speichert die angegebenen Daten (range)
function getDateRange() {
    if (startDatum && endDatum) {
        return [
            { start: startDatum.format('YYYY-MM-DD') },
            { end: endDatum.format('YYYY-MM-DD') }
        ];
    } else {
        return null;
    }
}

// Funktion um den ausgwählten Itemamount aus der Radiobox zu extrahieren
function getItemAmount() {
    const selectedRadio = document.querySelector('input[name="itemAmount"]:checked');
    if (selectedRadio) {
        return parseInt(selectedRadio.value);
    }
    return 5;
}

// Singleton-Fkt um gezeichnete Elemente zu verwalten
function getDrawnItems() {
    if (!sharedDrawnItems) {
        sharedDrawnItems = new L.FeatureGroup();
    }
    return sharedDrawnItems;
}

// Singleton-Fkt um Bbox zu verwalten
function setBounds(drawn) {
    if (!bboxString) {
        bboxString = drawn;
    }
    return bboxString;
}

// Singleton-Fkt um letzt-gesuchte Bbox zu verwalten
function setSearchedBbox(bbox) {
    if (!lastSearchedBbox) {
        lastSearchedBbox = bbox;
    }
    return lastSearchedBbox;
}

// Funktion um die letzt gesuchte Bbox zu verwalten
function getSearchedBbox(){
    if(lastSearchedBbox){
        return lastSearchedBbox;
    } else {
        return null;
    }
}

// Fassadenfunktion welche alle zum Start benötigten Funktionen ausführt
async function startWebsite(){
    lastSearchedBbox = null;
    const data = window.location.pathname.trim().toLowerCase();
    switch(data){
        case('/addmodel.html'):
            fetchCollections();
            const loggedIn = await isLoggedIn();
            if (loggedIn) {
                $(function() {
                    $('input[name="daterange"]').daterangepicker({
                        "locale": {
                            "format": "MM/DD/YYYY",
                            "separator": " - ",
                            "applyLabel": "Anwenden",
                            "cancelLabel": "Abbrechen",
                            "fromLabel": "Von",
                            "toLabel": "bis",
                            "customRangeLabel": "Custom",
                            "weekLabel": "W",
                            "daysOfWeek": [
                                "So",
                                "Mo",
                                "Di",
                                "Mi",
                                "Do",
                                "Fr",
                                "Sa"
                            ],
                            "monthNames": [
                                "Januar",
                                "Februar",
                                "März",
                                "April",
                                "Mai",
                                "Juni",
                                "Juli",
                                "August",
                                "September",
                                "Oktober",
                                "November",
                                "Dezember"
                            ],
                            "firstDay": 1
                        },
                        opens: 'left',
                        autoApply:true
                    }, function(start, end, label) {
                        startDatum = start;
                        endDatum = end;
                    });
                });
                const drawnItems = getDrawnItems();
                createInputForm(getExpectedItemInputs(), getExpectedItemInputsInfo());
                const map = L.map('map').setView([0, 0], 2);

                map.on('draw:created', function (event) {
                    const layer = event.layer;
                    drawnItems.addLayer(layer);
                    const bounds = layer.getBounds();
                    setBounds(bounds.toBBoxString())
                    getBounds()
                });

                L.tileLayer('https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);
            
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
            } else {
                createStandardView();
            }
            break;
        case('/addcollection.html'):
        const loggedInCo = await isLoggedIn();
        if (loggedInCo) {
            $(function() {
                $('input[name="daterange"]').daterangepicker({
                    "locale": {
                        "format": "MM/DD/YYYY",
                        "separator": " - ",
                        "applyLabel": "Anwenden",
                        "cancelLabel": "Abbrechen",
                        "fromLabel": "Von",
                        "toLabel": "bis",
                        "customRangeLabel": "Custom",
                        "weekLabel": "W",
                        "daysOfWeek": [
                            "So",
                            "Mo",
                            "Di",
                            "Mi",
                            "Do",
                            "Fr",
                            "Sa"
                        ],
                        "monthNames": [
                            "Januar",
                            "Februar",
                            "März",
                            "April",
                            "Mai",
                            "Juni",
                            "Juli",
                            "August",
                            "September",
                            "Oktober",
                            "November",
                            "Dezember"
                        ],
                        "firstDay": 1
                    },
                    opens: 'left',
                    autoApply:true
                }, function(start, end, label) {
                    startDatum = start;
                    endDatum = end;
                });
            });
            const drawnItems = getDrawnItems();
            createInputForm(getExpectedCollectionInputs(), getExpectedCollectionInputsInfo())
            const map = L.map('map').setView([0, 0], 2);

            map.on('draw:created', function (event) {
                const layer = event.layer;
                drawnItems.addLayer(layer);
                const bounds = layer.getBounds();
                setBounds(bounds.toBBoxString())
                getBounds()
            });

            L.tileLayer('https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
        
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
        } else {
            createStandardView();
        }
        break;
        case('/catalog.html'):
            document.addEventListener('DOMContentLoaded', () => {
                const modal = new bootstrap.Modal(document.getElementById('overlayWelcome'));
                if (sessionStorage.getItem('overlayWelcome') !== 'true') modal.show();
                document.getElementById('disableOverlay').onclick = () => {
                modal.hide();
                sessionStorage.setItem('overlayWelcome', 'true');
                };
            });
            lastSearchedBbox = null;
            fetchItems();
            document.getElementById('search-input').addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                if (searchTerm.length <= 2){
                    displayItems(allItems);
                }
                else{
                    let filteredItems = filterItemsForSearch(searchTerm);
                    if(filteredItems.length == 0){
                        displayItems(filteredItems);
                        showAlert(4,"Kein Item mit dem Suchterm ", `"${searchTerm}" gefunden.`);
                    }
                    else{
                        displayItems(filteredItems);        }
                }
            });

            setTimeout(function(){
                isLoggedIn()
            }, 50) 
        break;     
        case('/impressum.html'):
            setTimeout(function(){
                isLoggedIn()
            }, 50)
        break;  
        case('/welcome.html'):
            displayRecentItems();
            setTimeout(function(){
                isLoggedIn()
            }, 50)
        break;
        case('/howto.html'):
            setTimeout(function(){
                isLoggedIn()
            }, 50)
        break;
        default:
            window.location.href = '/welcome.html?showModal=true';
        break;
    }
}
startWebsite();


async function recentItems() {
    // Überprüfen, ob allItems ein Array ist

    response = await fetch('http://localhost:8000/items');
        if (!response.ok) {
            showAlert(4, "Fehler beim verbinden zum STAC.", "Überprüfe die Netzwerkverbindung.")
        }
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            allItems = data;
        } else {
            showAlert(4, "Fehler beim Abrufen der Items.", "Interner Fehler")
        }

    // Nach dem created_at-Attribut sortieren (neueste zuerst)
    const sortedItems = allItems.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA; // Neueste zuerst
    });

    // Die ersten 3 Elemente zurückgeben
    return sortedItems.slice(0, 5);
}


async function displayRecentItems() {
    const lastItems = await recentItems(); // Hol die letzten 3 Items
    
    // Container für die Ausgabe finden
    const container = document.getElementById('recent-items');
    if (!container) {
        return;
    }

    // Container leeren
    container.innerHTML = '';

    // Neue Elemente hinzufügen
    lastItems.forEach(item => {
        // Erstelle ein übergeordnetes Div für jedes Item
        const itemContainer = document.createElement('div');
        itemContainer.style.marginBottom = "1em"; // Abstand zwischen den Items
    
        // Erstelle ein h4-Element für mlm:name
        const nameElement = document.createElement('h4');
        nameElement.textContent = item.properties["mlm:name"];
        nameElement.style.margin = "0"; // Entfernung des Standardabstands
    
        // Erstelle ein p-Element für die restlichen Informationen
        const detailsElement = document.createElement('p');
        detailsElement.textContent = `Name: ${item.id}, Collection ID: ${item.collection_id}, Description: ${item.properties.description}`;
        detailsElement.style.marginTop = "0.5em"; // Optional: Abstand nach der Überschrift
    
        // Füge die Überschrift und den Text in das Container-Div ein
        itemContainer.appendChild(nameElement);
        itemContainer.appendChild(detailsElement);
    
        // Füge das Container-Div in den Hauptcontainer ein
        container.appendChild(itemContainer);
    });
}

// Funktion zum Filtern von Items (Suchleiste)
function filterItemsForSearch(searchTerm) { 
    if (!Array.isArray(allItems) || allItems.length === 0) 
        {
            return []; 
        } 
    
    if (!Array.isArray(allItems)) { console.error("allItems is not an array"); return []; } 
    
    const searchTermLower = searchTerm.toLowerCase();

    let filtered = allItems.filter(item => 
        (item?.['id'] || '').toLowerCase().includes(searchTermLower) ||
        //(item?.['type'] || '').toLowerCase().includes(searchTermLower()) || 
        (item?.['stac_version'] || '').toLowerCase().includes(searchTermLower) || 
        (Array.isArray(item?.['stac_extensions']) && item['stac_extensions'].some(ext => ext.toLowerCase().includes(searchTermLower))) ||
        (Array.isArray(item?.['bbox']) && item['bbox'].some(coord => coord.toString().includes(searchTermLower))) ||        
        (item?.properties?.['start_datetime'] || '').toLowerCase().includes(searchTermLower) ||
        (item?.properties?.['end_datetime'] || '').toLowerCase().includes(searchTermLower) ||                
        (item?.properties?.['description'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.properties?.['mlm:framework'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.properties?.['file:size'] || '').toString().toLowerCase().includes(searchTermLower) || 
        (item?.properties?.['mlm:accelerator'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.properties?.['mlm:name'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.properties?.['mlm_architecture'] || '').toLowerCase().includes(searchTermLower) || 
        (Array.isArray(item?.properties?.['mlm:tasks']) && item.properties['mlm:tasks'].some(task => task.toLowerCase().includes(searchTermLower))) ||        
        (Array.isArray(item?.properties?.['mlm:input']) && item.properties['mlm:input'].some(input => (input.name || '').toLowerCase().includes(searchTermLower))) ||        
        //(item?.['links'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.['collection_id'] || '').toLowerCase().includes(searchTermLower) || 
        (item?.['created_at'] ? new Date(item['created_at']).toISOString() : '').toLowerCase().includes(searchTermLower) ||
        (item?.['updated_at'] ? new Date(item['updated_at']).toISOString() : '').toLowerCase().includes(searchTermLower)
        ); 
                
        return filtered; 
}

// Schließt beim klicken des Anmelde/Register Buttons das Fenster ohne zu refreshen
function closeLoginTab(){
    const modalElement = document.getElementById('authModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        } 
    } else {
        console.error("Modal-Element nicht gefunden!");
    }
}

// Funktion zum Verwalten der gewollten Item-Userinputs
function getExpectedItemInputs(){
    return [    'name',
                'tasks',
                'description', 
                'id', 
                'geometry',
                'inputname', 
                'inputtypes', 
                'architecture', 
                'framework', 
                'frameworkversion', 
                'accelerator',
                'acceleratorsummary',
                'pretrainedsource',
                'batchsizesuggestion',
                'hyperparameter', 
                'collectionid', 
                'link']
}

// Funktion zum Verwalten der gewollten Collection-Userinputs
function getExpectedCollectionInputs(){
    return [    'id',
                'title',
                'description',
                'license'
            ]
}

// Funktion um Informationen zu den gewollten Userinputs zu verwalten
function getExpectedItemInputsInfo(){
    return[ 'Wähle einen aussagekräftigen Namen. Dieser wird später im Modellkatalog angezeigt.', 
            `Wähle aus den <a href=howto.html>verfügbaren Aufgaben</a> die zutreffenden für dein Modell.`, 
            'Füge eine umfassende Beschreibung deines Modells ein. Beschreibe dabei vor allem den Nutzen deines Modells.', 
            'Wähle eine eindeutige Modell-ID. Diese wird später nicht angezeigt.', 
            `Füge eine geschlossene Geometry ein. Für weitere Informationen besuche das <a href=howto.html>How-To</>.`,
            'Füge das benötigte Eingabemedium für dein Modell ein. Z.B. "Imagery".', 
            'Nenne hier alle benötigen Bestandteile der Eingabe, z.B. alle Bänder wie folgt: "B02, B03, ..".', 
            'Gebe an, nach welcher Architektur dein Modell erstellt wurde.', 
            'Füge ein, nach welchem Framework das Modell trainiert wurde.', 
            'Gebe an, in welcher Version sich das verwendete Framework befindet.', 
            'Beschreibe, welchen Hardwarebeschleuniger benutzt wurde.',
            'Gebe weitere Informationen zu der benötigten Hardware an, z.B. ob nur GPU genutzt wurde.',
            'Füge ein, von welcher Quelle die Daten zum vortrainieren benutzt wurden.',
            'Gebe an, wie viele Trainingsdatensätze im Optimalfall benötigt werden.',
            'Füge <a href=howto.html>weitere Informationen</a> zum Modell ein.', 
            'Wähle aus den verfügbaren Collections eine oder <a href=addcollection.html>füge eine neue hinzu.</a>', 
            'Füge den Modellink ein.'
    ]
}

// Funktion um Informationen zu den gewollten Userinputs zu verwalten
function getExpectedCollectionInputsInfo(){
    return [    'Eindeutige ID der Collection. Es sollte ein kurzer, lesbarer und einzigartiger String sein, der die Collection identifiziert.',
                'Titel der Collection. Eine kurze, beschreibende Bezeichnung, die den Inhalt der Collection zusammenfasst.',
                'Detaillierte Beschreibung der Collection. Was enthält die Collection und wofür ist sie gedacht?',
                'Die Lizenz der Collection. Hier wird definiert, wie die Daten verwendet werden dürfen (z. B. "CC-BY-4.0").'    ]
}

// Funktion um vorhandene Tasks zu verwalten
function getPredefinedTasks(){
    return [
        'Any-to-Any',
        'Audio Classification',
        'Audio-Text-to-Text',
        'Audio-to-Audio',
        'Automatic Speech Recognition',
        'Depth Estimation',
        'Document Question Answering',
        'Feature Extraction',
        'Fill-Mask',
        'Image Classification',
        'Image Feature Extraction',
        'Image Segmentation',
        'Image-Text-to-Text',
        'Image-to-3D',
        'Image-to-Image',
        'Image-to-Text',
        'Keypoint Detection',
        'Msaak Generation',
        'Object Detection',
        'Question Answering',
        'Reinforcement Learning',
        'Sentence Similarity',
        'Summarization',
        'Table Question Answering',
        'Tabular Classification',
        'Tabular Regression',
        'Text Classification',
        'Text Generation',
        'Text-to-3D',
        'Text-to-Image',
        'Text-to-Speech',
        'Text-to-Video',
        'Token Classification',
        'Translation',
        'Unconditional Image Generation',
        'Video Classification',
        'Video-Text-to-Text',
        'Visual Question Answering',
        'Zero-Shot Classification',
        'Zero-Shot Image Classification',
        'Zero-Shot Object Detection'
    ]    
}

// Funktion um Anmeldedaten vom Server anzufragen
async function loginUser(){
    const username = document.getElementById('login-username').value
    const password = document.getElementById('login-password').value

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try{
        const response = await fetch('http://localhost:8000/auth/token',{
            method: 'POST',
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: formData.toString()
        });
        if(response.ok){
                const data = await response.json()
                showAlert(3, "Erfolgreich angemeldet. Willkommen zurück ", username)
                sessionStorage.setItem('token', data.access_token)
                successfulLoggedIn(username)
                startWebsite();
        } else{
            showAlert(4, "Ungültige Anmeldedaten. Probiere es erneut.", "")
        }
    }
    catch(error){
        showAlert(4, "Fehler beim Anmelden.", "Passwort oder Nutzername falsch.")
    }
}

// Funktion um den aktuellen Nutzer abzumelden
function logoutUser(){
    sessionStorage.setItem('token', null)
    closeLoginTab();
    isLoggedIn();
    successfulLoggedOut();
    startWebsite();
    setTimeout(function(){
        showAlert(3, "Account abgemeldet. Bis zum nächsten Mal!", "");
    }, 1) 
}

// Funktion um Authentifizierungsdaten abzufragen
async function getAuthData() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:8000/user', {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.username === null && data.id === null) {
            return null;
        } else {
            return data;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Funktion fragt den Authorisierungsstatus ab
async function isLoggedIn() {
    const logged = await getAuthData();
    if (logged && logged.username && logged.id) {
        successfulLoggedIn(logged)
        return true;
    } else {
        return false;
    }
}

// Funktion um Standardansicht ohne Anmeldung zu generieren.
function createStandardView(){
    const file = window.location.pathname.trim().toLowerCase();
    const sidebar = document.getElementById('sidebar')
    const main = document.getElementById('main-contentdesc')

    switch(file){
        case('/addmodel.html'):
            sidebar.innerHTML = ''
            sidebar.innerHTML = `
                <nav id="sidebar" class="col-md-3 col-lg-3 d-md-block collapse">                  
                    <div class="position-sticky d-flex flex-column h-100">
                        <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" style="height: 75%;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="82" height="82" fill="#1C3D86" class="bi bi-person-fill-x mb-3" viewBox="0 0 16 16">
                                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
                                <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m-.646-4.854.646.647.646-.647a.5.5 0 0 1 .708.708l-.647.646.647.646a.5.5 0 0 1-.708.708l-.646-.647-.646.647a.5.5 0 0 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 .708-.708"/>
                            </svg>
                            <div class="text-center" style="font-weight: 300; color:#1C3D86; text-transform: uppercase; font-size: 10px; ">
                                <span>Melde dich an, um eigene Modelle hinzuzufügen!</span>
                            </div>
                        </div>
                        <div id="sidebar-footer" class="mt-auto" style="height: 25%;">
                            <hr>
                            <a id="sidebar-footerlink-login" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>
                        </div>
                    </div>  
                </nav>
        `
        main.innerHTML = ''
        main.innerHTML = `
                <div id="main-contentdesc">
                <div id="main-contenttitle" style="text-align: center; color: #1C3D86; font-size: 32px; font-weight: 700; margin: 20px;">
                    Modell hinzufügen
                </div>
                <div id="main-contenttext" style="font-size:16px; text-align:center; font-weight:300; margin: 20px;">
                    Melde dich zunächst mit einem bestehenden Account an, oder registriere einen Neuen, um ein eigenes Modell hinzuzufügen und alle Vorteile des wthrd.tech-Katalogs zu nutzen.
                </div>
                    <div style="margin-top: 50px;text-align:center;">
                        <button class="button-input" style="font-size: 14px;" data-bs-toggle="modal" data-bs-target="#authModal">Jetzt anmelden</button>
                    </div>
                    <div style="text-align:center;">
                        <a class="text-muted button-input" style="font-size: 11px; font-weight: 200;" href="addcollection.html" data-bs-toggle="modal" data-bs-target="#authModal">Oder neu registrieren.</a>
                    </div>`
    break;
    case('/addcollection.html'):
            sidebar.innerHTML = ''
            sidebar.innerHTML = `
                <nav id="sidebar" class="col-md-3 col-lg-3 d-md-block collapse">                  
                    <div class="position-sticky d-flex flex-column h-100">
                        <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" style="height: 75%;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="82" height="82" fill="#1C3D86" class="bi bi-person-fill-x mb-3" viewBox="0 0 16 16">
                                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
                                <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m-.646-4.854.646.647.646-.647a.5.5 0 0 1 .708.708l-.647.646.647.646a.5.5 0 0 1-.708.708l-.646-.647-.646.647a.5.5 0 0 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 .708-.708"/>
                            </svg>
                            <div class="text-center" style="font-weight: 300; color:#1C3D86; text-transform: uppercase; font-size: 10px; ">
                                <span>Melde dich an, um eigene Collections hinzuzufügen!</span>
                            </div>
                        </div>
                        <div id="sidebar-footer" class="mt-auto" style="height: 25%;">
                            <hr>
                            <a id="sidebar-footerlink-login" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>
                        </div>
                    </div>  
                </nav>
        `
        main.innerHTML = ''
        main.innerHTML = `
                <div id="main-contentdesc">
                <div id="main-contenttitle" style="text-align: center; color: #1C3D86; font-size: 32px; font-weight: 700; margin: 20px;">
                    Collection hinzufügen
                </div>
                <div id="main-contenttext" style="font-size:16px; text-align:center; font-weight:300; margin: 20px;">
                    Melde dich zunächst mit einem bestehenden Account an, oder registriere einen Neuen, um eine eigene Collection hinzuzufügen und alle Vorteile des wthrd.tech-Katalogs zu nutzen.
                </div>
                    <div style="margin-top: 50px;text-align:center;">
                        <button class="button-input" style="font-size: 14px;" data-bs-toggle="modal" data-bs-target="#authModal">Jetzt anmelden</button>
                    </div>
                    <div style="text-align:center;">
                        <a class="text-muted button-input" style="font-size: 11px; font-weight: 200;" data-bs-toggle="modal" data-bs-target="#authModal">Oder neu registrieren.</a>
                    </div>`
    break;
    }
}

// Funktion um Registrierungsdaten an den Server zu senden
async function registerUser(){
    const username = document.getElementById('register-username').value
    const prename = document.getElementById('register-prename').value
    const lastname = document.getElementById('register-lastname').value
    const email = document.getElementById('register-email').value
    const password = document.getElementById('register-password').value

    const body ={
        username: username,
        password: password,
        prename: prename,
        lastname: lastname,
        email: email
    };

    try{
        const response = await fetch('http://localhost:8000/auth/',{
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if(response.ok){
            showAlert(3, "Erfolgreich registriert. Melde dich nun an und aktualisiere die Website!", "")
        } else{
            showAlert(4, "Fehler bei der Registrierung. Nutze ggf. einen anderen Nutzername oder E-Mail.", "")
        }
    }
    catch(error){
        showAlert(4, "Fehler", "aus registerUser")
    }
}

// Fetchen aller Modelle
async function fetchItems() {
    try {
        const response = await fetch('http://localhost:8000/items');
        if (!response.ok) {
            showAlert(4, "Fehler beim verbinden zum STAC.", "Überprüfe die Netzwerkverbindung.")
        }
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            allItems = data;
            printAllFilters(data);
            displayItems(data, undefined);
        } else {
            showAlert(4, "Fehler beim Abrufen der Items.", "Interner Fehler.")
        }
    } catch (error) {
        showAlert(4, "Fehler beim Abrufen der Items oder bei der Verbindung zum STAC.", "Überprüfe die Netzwerkverbindung.")
    }
}

// Adden des Items aus Eingabemaske
async function addItems() {
    const input = getUserInputs();
    const token = sessionStorage.getItem("token");
    try {
        const response = await fetch('http://localhost:8000/addItem/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            
            body: JSON.stringify({
                id: input.id,
                type: 'Feature',
                stac_version: "1.0.0",
                stac_extensions: ["https://stac-extensions.github.io/file/v2.1.0/schema.json","https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json"],
                geometry: getGeometry(),
                bbox: getBounds(),
                properties: {
                    title: input.title,
                    description: input.description,
                    datetime: "2024-12-04T16:20:00",
                    "mlm:name": input.name,
                    "mlm:architecture": input.architecture,
                    "mlm:tasks": input.tasks.split(',').map(value => value.trim()),
                    "mlm:framework": input.framework,
                    "mlm:framework_version": input.frameworkversion,
                    "mlm:pretrained": getPretrained(),
                    "mlm:pretrained_source": input.pretrainedsource,
                    "mlm:batch_size_suggestion": input.batchsizesuggestion,
                    "mlm:accelerator":input.accelerator,
                    "mlm:accelerator_summary":input.acceleratorsummary,
                    end_datetime: getDateRange()[1].end,
                    start_datetime: getDateRange()[0].start,
                    "mlm:input": [
                        {
                            name: input.inputname,
                            type: input.inputtypes.split(',').map(value => value.trim())
                        }
                    ],
                    "mlm:output":[ {
                        type: "class",
                        num_classes: 1000
                    }],
                    "mlm:hyperparameters": input.hyperparameter
                },
                links: [
                    { href: "https://example.com/item", type: "application/json", rel: "self" },
                    { href: "http://localhost:8000/collections", type: "application/json", rel: "parent" },
                    { href: "http://localhost:8000/", type: "application/json", rel: "root" },
                    { href: `http://localhost:8000/collections/${input.collectionid}`, type: "application/json", rel: "collection" }
                ],
                assets: {
                    model: {
                        href: input.link
                    },
                    thumbnail: { href: "https://example.com/thumbnail.png" },
                    data: { href: "https://example.com/data" }
                },
                collection_id: input.collectionid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                color: getSelectedColor()
            })
        });
        const data = await response.json();

        // Verarbeiten der Nachricht aus der API-Antwort
        if (data.message === "Item added successfully") {

            showAlert(3, "Neues Modell erfolgreich hinzugefügt.", "");
        } else if (data.detail){
            if (Array.isArray(data.detail)){
                data.detail.forEach((error) => {
                    if (error.loc.includes("geometry") && error.msg === "The geometry must have 'type' and 'coordinates' keys.") {
                        showAlert(4, "Geometrie muss ein valides JSON sein und 'type' sowie 'coordinates' enthalten!");
                    } else if(error.loc.includes("geometry") && error.msg.includes("Invalid geometry type")) {
                        showAlert(4, `Ungültiger Geometrietyp: ${error.msg}`, "");
                    } else if(error.loc.includes("geometry") && error.msg === ("The 'coordinates' key must contain a list.")) {
                        showAlert(4, "Zum Key 'coordinates' muss der Value ein Array sein.", "");
                    } else if (error.loc.includes("geometry") && error.msg.includes("field required")) {
                        showAlert(4, "JSON der Geometrie leer oder Syntax-Fehler!", "");
                    } else if (error.loc.includes("color") && error.msg.includes("Invalid color format")) {
                        showAlert(4, "Ungültiger Farbcode! Bitte einen HEX-Wert wie #RRGGBB eingeben.", "");
                    } else if (error.loc.includes("properties") && error.msg.includes("must contain following keys")) {
                        showAlert(4, `Die benötigten MLM-Properties wurden nicht angegeben. Bitte gib die folgenden Werte an: ${error.msg}`, "");
                    } else if (error.loc.includes("properties") && error.msg.includes("Batchgröße muss ein Integer sein")) {
                        showAlert(4, `${error.msg}`, "");
                    }
                    else {
                        // Generische Fehlermeldung für alles andere
                        showAlert(4, `Fehler bei Feld '${error.loc.join(" -> ")}': ${error.msg}`);
                    }
                });
            }
            else {
                showAlert(4, `${data.detail}`);
            }
        }
        else{
            // Fallback für unerwartete Fehler
            showAlert(4, "Ein unbekannter Fehler ist aufgetreten.", "");
        }
                   
    } catch (error) {
        showAlert(4, "Item konnte nicht hinzugefügt werden.", "");
    }
}

// Funktion um alle bestehenden Collections abzufragen
async function fetchCollections(){
    try {
        const response = await fetch('http://localhost:8000/collections');
        if (!response.ok) {
            showAlert(4, "Fehler beim verbinden zum STAC.", "Collections können nicht abgerufen werden.")
        }
        const data = await response.json();

        if (data) {
            allCollections = data;
        } else {
            showAlert(4, "Fehler beim Abrufen der Collections.", "Interner Fehler.")
        }
    } catch (error) {
        showAlert(4, "Fehler beim Abrufen der Collections oder bei der Verbindung zum STAC.", "Überprüfe die Netzwerkverbindung.")
    }
}

// Adden von Collections aus Eingabemaske
async function addCollections(){
    const input = getUserInputs();
    const token = sessionStorage.getItem("token");
    try {
        const response = await fetch('http://localhost:8000/addCollection/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            
            body: JSON.stringify({
                "stac_version": "1.0.0",
                "type": "Collection",
                "title": input.title,
                "license": input.license,
                "catalog_id": "Catalog for MLM",
                "updated_at": "2025-01-27T10:50:20.469758+00:00",
                "id": input.id,
                "stac_extensions": ["https://stac-extensions.github.io/file/v2.1.0/schema.json","https://crim-ca.github.io/mlm-extension/v1.2.0/schema.json"],
                "description": input.description,
                "extent": {
                  "spatial": {
                    "bbox": [
                      getBounds()
                    ]
                  },
                  "temporal": {
                    "interval": [
                      [
                        getDateRange()[1].end,
                        getDateRange()[0].start
                      ]
                    ]
                  }
                },
                "created_at": new Date().toISOString(),
                "links": [
                  {
                    "rel": "self",
                    "type": "application/json",
                    "href": `http://localhost:8000/collections/${input.id}`
                  },
                  {
                    "rel": "items",
                    "type": "application/json",
                    "href": `http://localhost:8000/collections/${input.id}/items`
                  },
                  {
                    "rel": "parent",
                    "type": "application/json",
                    "href": "http://localhost:8000/"
                  },
                  {
                    "rel": "root",
                    "type": "application/json",
                    "href": "http://localhost:8000/"
                  }
                ]
              })
        });
        const data = await response.json();

        if (data.message === "Collection added successfully") {

            showAlert(3, "Neue Collection erfolgreich hinzugefügt.", "");
        } else if (data.detail){
            if (Array.isArray(data.detail)){
                data.detail.forEach((error) => {
                    if (error.loc.includes("title") && error.msg === "title must be provided") {
                        showAlert(4, "Bitte einen Titel angeben!", "");
                    } else if(error.loc.includes("id") && error.msg.includes("id must be provided")) {
                        showAlert(4, `ID darf nicht leer sein!`, "");
                    } else if(error.loc.includes("description") && error.msg === ("description must be provided")) {
                        showAlert(4, "Bitte eine Beschreibung angeben!", "");
                    } else if (error.loc.includes("license") && error.msg.includes("license must be provided")) {
                        showAlert(4, "Bitte eine Lizenz angeben!", "");
                    }
                    else {
                        // Generische Fehlermeldung für alles andere
                        showAlert(4, `Fehler bei Feld '${error.loc.join(" -> ")}': ${error.msg}`);
                    }
                });
            }
            else {
                showAlert(4, `${data.detail}`, "");
            }
        }
        else{
            // Fallback für unerwartete Fehler
            showAlert(4, "Ein unbekannter Fehler ist aufgetreten.", "");
        }    
    } catch (error) {
        showAlert(4, "Collection konnte nicht hinzugefügt werden.", "");
    }

}

// Funktion um die Geometry auszugeben
function getGeometry() {
    const userInputs = getUserInputs()
    const geometry = userInputs.geometry
    try{
        const result = JSON.parse(geometry)
        return result
    }
    catch(error){
        showAlert(4, "Die Geometrie ist kein valides JSON. Achte auf korrekte Syntax.")
    }

}

// Funktion um immer die aktuelle Bounding Box von der Karte zu extrahieren
function getBounds() {
    if(bboxString){
        const bounds = bboxString;
        return bounds.split(',').map(value => parseFloat(value.trim()));
    }else{
        return null;
    }
}

// Erstellt dynmaisch die gefragten Inputs für ein vollständiges Modell
function createInputForm(data, inputinfo) {
    const file = window.location.pathname.trim().toLowerCase();
    const parameters = data;
    const container = document.getElementById('main-inputcontainer');
    const info = inputinfo
    createInputTOC(data);
    container.innerHTML = '';
    var count = 0

    container.innerHTML = `
        <table class="w-100">
            <tbody id="input-table-body"></tbody>
        </table>
    `;

    const tableBody = document.getElementById('input-table-body');

    parameters.forEach(parameter => {
        count += 1
        tableBody.innerHTML += `
            <tr id="main-inputgroup">
                <td id="inputexp-${parameter}" class="main-inputexp">${count}) ${parameter}<br><span class="main-inputinfo">${info[count-1]}</span></td>
                <td id="main-inputelem" class="main-inputelem flex-grow-1 d-flex justify-content-center">
                    <div id="input-${parameter}-div">
                        <input id="input-${parameter}" class="main-inputwindow" />
                    </div>
                </td>
                <td id="" class="main-inputalert"></td>
            </tr>
        `;
    });
    count += 1;

    switch(file){
        case('/addmodel.html'): 
            // Bounding Box-Option
                tableBody.innerHTML += `
                <tr id="main-inputgroup">
                    <td id="inputexp-map" class="main-inputexp">${count}) Bounding Box<br><span class="main-inputinfo">Markiere auf der Karte den Bereich, auf den das Modell anwendbar ist.</span></td>
                    <td id="main-inputelem" class="main-inputelem flex-grow-1 justify-content-center">
                        <div id="map" style="width:120%;height:100%;"></div>
                    </td>
                    <td id="" class="main-inputalert"></td>
                </tr>
            `;
            count += 1;

            // Farbcode-Option hinzufügen
            tableBody.innerHTML += `
                <tr id="main-inputgroup">
                    <td id="inputexp-color" class="main-inputexp">${count}) Farbgebung<br><span class="main-inputinfo">Wähle eine individuelle Farbe, in welcher später das Modell angezeigt wird.</span></td>
                    <td id="main-inputelem" class="main-inputelem flex-grow-1 justify-content-center">
                        <input style="border: solid 2px black; border-radius: 3px;" id="main-inputelem-color" style="height: 30px;" class="w-50" type="color" />
                    </td>
                    <td id="" class="main-inputalert"></td>
                </tr>
            `;

            count += 1;

            // Zeitraumauswahö
            tableBody.innerHTML += `
                <tr id="main-inputgroup">
                    <td id="inputexp-date" class="main-inputexp">${count}) Zeitraum<br><span class="main-inputinfo">Wähle aus, für welchen Zeitraum das Modell trainiert ist.</span></td>
                    <td style="margin-top: 20px; display: flex;" class="main-inputelem flex-grow-1 justify-content-center">
                        <input style="width: 75%; text-align:center; border: solid 2px black; border-radius: 3px;" type="text" name="daterange" value="01/01/2000 - 01/01/2100" />
                    </td>
                    <td id="" class="main-inputalert"></td>
                </tr>
            `;

            count += 1;

            // Vortrainiert-Auswahl
            tableBody.innerHTML += `
                <tr id="main-inputgroup">
                    <td id="inputexp-pretrained" class="main-inputexp">${count}) Vortrainiert<br><span class="main-inputinfo">Gebe an, ob dein Modell vortrainiert wurde.</span></td>
                    <td style="margin-top: 20px; display: flex;" class="main-inputelem flex-grow-1 justify-content-center">
                        <input id="input-pretrained" style="border:2px solid; border-radius: 3px;" type="checkbox"/>
                    </td>
                    <td id="" class="main-inputalert"></td>
                </tr>
            `;

            // Buttons zum absenden un analysieren
            container.innerHTML += `
                <div id="main-buttonarea">
                    <button class="button-input" onclick="analyzeInput(getExpectedItemInputs())"id="main-button-analyse">Analysieren</button>
                    <button class="button-input" onclick="sendInput(getExpectedItemInputs());window.location.href='#topbar'"id="main-button-send">Abschicken</button>
                </div>
            `
            createDynamicInputs();
        break;
        case('/addcollection.html'):
            // Datenschutz-Auswahl
            tableBody.innerHTML += `
                <tr id="main-inputgroup">
                    <td id="inputexp-public" class="main-inputexp">${count}) Öffentlich<br><span class="main-inputinfo">Gebe an, ob deine Collection öffentlich sein soll, sodass alle Nutzer ein Modell zu deiner Collection hinzufügen können.</span></td>
                    <td style="margin-top: 20px; display: flex;" class="main-inputelem flex-grow-1 justify-content-center">
                        <input id="input-pretrained" style="border:2px solid; border-radius: 3px;" type="checkbox"/>
                    </td>
                    <td id="" class="main-inputalert"></td>
                </tr>
            `;
            count += 1;

            // Buttons zum absenden un analysieren
            container.innerHTML += `
            <div id="main-buttonarea">
                <button class="button-input" onclick="analyzeInput(getExpectedCollectionInputs())"id="main-button-analyse">Analysieren</button>
                <button class="button-input" onclick="sendInput(getExpectedCollectionInputs());window.location.href='#topbar'"id="main-button-send">Abschicken</button>
            </div>
            `
        break;
    }
}

// Funktion um Tasks mit Dropdownmenü anzureichern
async function createDynamicInputs() {
    const taskDiv = document.getElementById('input-tasks-div');
    taskDiv.innerHTML = ''
    const inputFieldTask = document.createElement('input');
    const dropdown = document.createElement('div');
    const tasks = getPredefinedTasks();

    inputFieldTask.setAttribute('class', 'main-inputwindow');
    inputFieldTask.setAttribute('id', 'input-tasks');
    inputFieldTask.setAttribute('placeholder', 'Tasks..');
    inputFieldTask.setAttribute('readonly', 'true');
    taskDiv.appendChild(inputFieldTask);

    dropdown.setAttribute('id', 'dropdown-options');
    dropdown.setAttribute('class', 'main-inputdynamic');
    dropdown.style.cssText = 'position: inherit; top: 100%; left: 0; max-height: 350px; overflow-y: auto; display: none;';
    taskDiv.appendChild(dropdown);
    tasks.forEach(task => {
        const checkboxItem = document.createElement('div');
        checkboxItem.style.cssText = 'padding: 5px; cursor: pointer;';
        checkboxItem.innerHTML = `
            <input type="checkbox" id="task-${task}" value="${task}" style="margin-right: 5px;" />
            <label for="task-${task}">${task}</label>
        `;
        checkboxItem.querySelector('input').addEventListener('change', updateSelectedTasks);
        dropdown.appendChild(checkboxItem);
    });

    inputFieldTask.addEventListener('click', () => {
        dropdown.style.cssText = 'max-width: 150px;'
        dropdown.style.display = dropdown.style.display === 'inherit' ? 'none' : 'inherit';
    });

    document.addEventListener('click', event => {
        if (!taskDiv.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    const collectionDiv = document.getElementById('input-collectionid-div');
    collectionDiv.innerHTML = '';

    const inputFieldCol = document.createElement('input');
    const dropdownCol = document.createElement('div');

    await fetchCollections();
    const collections = Array.isArray(allCollections) ? allCollections : Object.values(allCollections).flat();

    inputFieldCol.setAttribute('class', 'main-inputwindow');
    inputFieldCol.setAttribute('id', 'input-collectionid');
    inputFieldCol.setAttribute('placeholder', 'Collections..');
    inputFieldCol.setAttribute('readonly', 'true');
    collectionDiv.appendChild(inputFieldCol);

    dropdownCol.setAttribute('id', 'dropdown-collections');
    dropdownCol.setAttribute('class', 'main-inputdynamic');
    dropdownCol.style.cssText = 'position: inherit; top: 100%; left: 0; max-height: 350px; overflow-y: auto; display: none;';
    collectionDiv.appendChild(dropdownCol);

    collections.forEach(col => {
        if (col && col.id) {
            const checkboxItemCol = document.createElement('div');
            checkboxItemCol.style.cssText = 'padding: 5px; cursor: pointer;';
            checkboxItemCol.innerHTML = `
                <input type="checkbox" id="collection-${col.id}" value="${col.id}" style="margin-right: 5px;" />
                <label for="collection-${col.id}">${col.id}</label>
            `;
    
            checkboxItemCol.querySelector('input').addEventListener('change', updateSelectedCollections);
            dropdownCol.appendChild(checkboxItemCol);
        }
    });
    

    inputFieldCol.addEventListener('click', () => {
        dropdownCol.style.display = dropdownCol.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', event => {
        if (!collectionDiv.contains(event.target)) {
            dropdownCol.style.display = 'none';
        }
    }, true);
}

// Funktion um die ausgewählten Tasks in die Eingabemaske einzufügen
function updateSelectedTasks(){
    const checkboxes = document.querySelectorAll('#dropdown-options input:checked');
    const selectedTasks = Array.from(checkboxes).map(checkbox => checkbox.value);
    document.getElementById('input-tasks').value = selectedTasks.join(', ');
}

// Funktion um die ausgewählte Collection in die Eingabemaske einzufügen
function updateSelectedCollections(event){
    const checkboxes = document.querySelectorAll('#dropdown-collections input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (checkbox !== event.target) {
            checkbox.checked = false;
        }
    });
    const selectedCollection = event.target.checked ? event.target.value : '';
    document.getElementById('input-collectionid').value = selectedCollection;
}

// Funktion um alle User Eingaben abzugreifen und in ein Array zu bündeln
function getUserInputs() {
    const file = window.location.pathname.trim().toLowerCase();
    let expected;

    switch(file){
        case('/addmodel.html'):
            expected = getExpectedItemInputs();
        break;
        case('/addcollection.html'):
            expected = getExpectedCollectionInputs();
        break;
    }

    const input = {};
    for (const p of expected) {
        const element = document.getElementById('input-' + p);
        if (element) {
            input[p] = element.value;
        }
    }
    return input;
}

//Funktion um den Inhalt des Input forms vor dem Abschicken zu analysieren
function analyzeInput(expected){
    const file = window.location.pathname.trim().toLowerCase();
    const parameters = expected;
    const data = getUserInputs(); 
    const missing = [];
    parameters.forEach(parameter =>{
        if (data[parameter] === undefined || data[parameter] === null || data[parameter] === "") {
            missing.push(parameter)
        } else {
            return;
        }
    });
    switch(file){
        case('/addmodel.html'):
            const bounding = getBounds();
            const hex = document.getElementById("main-inputelem-color").value;
            const date = getDateRange();
            if (bounding === undefined || bounding === null || bounding === "") {
                missing.push('Bounding')
            }
            if (hex === undefined || hex === null || hex === "" || hex === '#000000') {
                missing.push('Color')
            }
            if (date === undefined || date === null || date === "") {
                missing.push('Date')
            }
        break;
        case('/addcollection.html'):
        break;
    }
    changeInputTOC(parameters, missing);
    return missing;
}

// Funktion um den Inputform abzusenden, falls korrekt gefüllt
function sendInput(expected){
    const file = window.location.pathname.trim().toLowerCase();

    const missing = analyzeInput(expected);

    if (missing.length > 0) {
        showAlert(4, "Bitte füllen Sie alle Eingabefelder korrekt aus.", "");
    } else {
        switch(file){
            case('/addmodel.html'):
                addItems(); 
            break;
            case('/addcollection.html'):
                addCollections();
            break;
        }
    }
}

// Funktion um ausgewählte Farbe beim hinzufügen eines Modells zu sichern
function getSelectedColor() {
    const colorInput = document.getElementById('main-inputelem-color');
    if (colorInput) {
        return colorInput.value.toUpperCase();
    }
}

// Funktion zum dynamischen Erstellen des Inhaltsverzeichnisses mit Scrollfunktion
async function createInputTOC(data) {
    const file = window.location.pathname.trim().toLowerCase();
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
                <a class="nav-link" style="color:green; margin-top: -15px;" href="#inputexp-${parameter}">${parameter}</a>
            </li>
        `;
    });
    
    // Feststehende Elemente hinzufügen
    switch(file){
        case('/addmodel.html'):
            sidebarList.innerHTML += `
            <li class="nav-item">
                <a class="nav-link" style="color:green; margin-top: -15px; " href="#inputexp-map">Bounding Box</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" style="color:green; margin-top: -15px;" href="#inputexp-color">Farbgebung</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" style="color:green; margin-top: -15px;" href="#inputexp-date">Zeitraum</a>
            </li>
            `;
        break;
        case('/addcollection.html'):
            sidebarList.innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" style="color:green; margin-top: -15px; " href="#inputexp-public">Öffentlich</a>
                </li>
            `
        break;
    }
}

// Funktion zum anpassen vom Inhaltsverzeichnis des Inputsforms je nach Eingabe 
function changeInputTOC(data, pois){
    const file = window.location.pathname.trim().toLowerCase();
    const parameters = data;
    const changeList = pois;

    const sidebar = document.getElementById("sidebar");
    const sidebarList = sidebar.querySelector(".nav.flex-column");
        
    // Titel hinzufügen
    sidebarList.innerHTML = `                        
        <h6 id="sidebar-groupheader" class="sidebar-heading d-flex align-items-center mt-4 mb-1 text-muted">
            <span>Inhaltsverzeichnis</span>
        </h6><hr>`;
    
    // Dynamisch alle Parameter hinzufügen
    parameters.forEach(parameter => {
        if (changeList.includes(parameter)) {
                    sidebarList.innerHTML += `
                        <li class="nav-item d-flex align-items-center">
                            <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                            </svg>
                            <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-${parameter}">${parameter}</a>
                        </li>
                    `;
            } 
        else {
            sidebarList.innerHTML += `
            <li class="nav-item d-flex align-items-center">
                <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
                <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-${parameter}">${parameter}</a>
            </li>
        `;
        }
    });

    switch(file){
        case('/addmodel.html'):
            if (changeList.includes('Bounding')){
                    sidebarList.innerHTML += `
                                <li class="nav-item d-flex align-items-center">
                                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                    </svg>
                                    <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-map">Bounding Box</a>
                                </li>
                    `;
                }
            else{
                sidebarList.innerHTML += `
                <li class="nav-item d-flex align-items-center">
                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-map">Bounding Box</a>
                </li>
        `;
            }

            if (changeList.includes('Color')){
                    sidebarList.innerHTML += `
                                <li class="nav-item d-flex align-items-center">
                                    <svg style="margin-top: -10px;"xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                    </svg>
                                    <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-color">Farbgebung</a>
                                </li>
                    `;
                }
            else{
                sidebarList.innerHTML += `
                <li class="nav-item d-flex align-items-center">
                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-color">Farbgebung</a>
                </li>
        `;
            }

            if (changeList.includes('Date')){
                sidebarList.innerHTML += `
                            <li class="nav-item d-flex align-items-center">
                                <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                </svg>
                                <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-date">Zeitraum</a>
                            </li>
                `;
            }
            else{
                sidebarList.innerHTML += `
                <li class="nav-item d-flex align-items-center">
                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-date">Zeitraum</a>
                </li>
            `;
            }
        break;
        case('/addcollection.html'):
            if (changeList.includes('Bounding')){
                sidebarList.innerHTML += `
                            <li class="nav-item d-flex align-items-center">
                                <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                </svg>
                                <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-map">Bounding Box</a>
                            </li>
                `;
            }
            else{
                sidebarList.innerHTML += `
                <li class="nav-item d-flex align-items-center">
                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-map">Bounding Box</a>
                </li>
            `;
            }
            if (changeList.includes('Date')){
                sidebarList.innerHTML += `
                            <li class="nav-item d-flex align-items-center">
                                <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                </svg>
                                <a class="nav-link me-2" style="color:red; margin-top: -15px;" href="#inputexp-date">Zeitraum</a>
                            </li>
                `;
            }
            else{
                sidebarList.innerHTML += `
                <li class="nav-item d-flex align-items-center">
                    <svg style="margin-top: -10px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    <a class="nav-link me-2" style="color:green; margin-top: -15px;" href="#inputexp-date">Zeitraum</a>
                </li>
            `;
            }
        break;
    }
}

// Funktion zum anzeigen aller verfügbaren unique Filtervalues in der Sidebar
function printAllFilters(items){
    const filters = extractUniqueFilterValues(items);
    let filterContent = '';
    const sidebar = document.getElementById("sidebar");

    sidebar.innerHTML = '';

    let header = `
        <div style="margin-top:15px;">
            <a id="sidebar-footerlink" onclick="clearFilters()" class="nav-link">Leeren</a>
        </div>
        <hr>
    `;

    const toggleButton = ``;

    // Bbox zum Zeichnen
    const bboxCollapseId = "collapse-bbox";
    filterContent += `
        <span id="sidebar-groupheader" class="sidebar-heading d-flex mt-1 align-items-center">
            <button style="text-decoration:none;" class="btn btn-link toggle-collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${bboxCollapseId}" aria-expanded="false" aria-controls="${bboxCollapseId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-right" viewBox="0 0 16 16">
                    <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
                    </svg>
                <span id="sidebar-groupheader">Bounding Box</span>
            </button>
        </span>
        <div class="collapse" id="${bboxCollapseId}">
            <div id="sidebar-map" style="height: 300px; margin-top: 10px;"></div>
        </div>
    `;

    Object.keys(filters).forEach(group => {
        let options = '';
        const collapseId = `collapse-${group}`;
    
        filters[group].forEach(option => {
            const optionId = `filter-${group}-${option}`;
            options += `
                <div class="form-check form-check-inline">
                    <input type="checkbox" class="form-check-input" id="${optionId}" value="${option}" data-group="${group}">
                    <label class="form-check-label" for="${optionId}">${option}</label>
                </div>
            `;
        });
    
        filterContent += `
            <span style="margin-top: -10px;"id="sidebar-groupheader" class="sidebar-heading d-flex mt-1 align-items-center">
                <button style="text-decoration:none;" class="btn btn-link toggle-collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-right" viewBox="0 0 16 16">
                    <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
                    </svg>
                    <span id="sidebar-groupheader">${group}</span>
                </button>
            </span>
            <div class="collapse" id="${collapseId}">
                <div class="d-flex flex-wrap">
                    ${options}
                </div>
            </div>
        `;
    });

    // Datepicker
    const datepickerCollapseId = "collapse-datepicker";
    filterContent += `
        <span id="sidebar-groupheader" class="sidebar-heading d-flex mt-1 align-items-center">
            <button style="text-decoration:none;" class="btn btn-link toggle-collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${datepickerCollapseId}" aria-expanded="false" aria-controls="${datepickerCollapseId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-right" viewBox="0 0 16 16">
                    <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
                    </svg>
                <span id="sidebar-groupheader">Zeitraum</span>
            </button>
        </span>
        <div class="collapse" id="${datepickerCollapseId}">
            <div style="margin-top: 5px;">
                <input style="background-color:transparent; text-align:center; font-weight: 300; border: 1px solid"type="text" name="daterange" id="daterange" class="form-control" />
            </div>
        </div>
    `;

    const footer = `
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <a id="sidebar-footerlink-login" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>
        </div>
    `;

    sidebar.innerHTML += header + toggleButton + filterContent + footer;

    // Observer für bessere Performance
    const mapContainer = document.getElementById("sidebar-map");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const map = L.map(mapContainer).setView([51.1657, 10.4515], 2);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap'
                }).addTo(map);

                let drawnRectangle = null;
                const drawControl = new L.Control.Draw({
                    draw: {
                        polygon: false,
                        polyline: false,
                        circle: false,
                        marker: false,
                        circlemarker: false,
                        rectangle: true
                    }
                });
                map.addControl(drawControl);

                map.on(L.Draw.Event.CREATED, (e) => {
                    if (drawnRectangle) {
                        map.removeLayer(drawnRectangle);
                    }
                    drawnRectangle = e.layer;
                    map.addLayer(drawnRectangle);
                
                    drawnRectangle.setStyle({
                        color: '#1C3D86',
                        weight: 2,
                        opacity: 1,
                        fillColor: '#1C3D86',
                        fillOpacity: 0.3
                    });

                    const bounds = drawnRectangle.getBounds();
                    selectedFilters['bbox'] = [
                        bounds.getWest(),
                        bounds.getSouth(),
                        bounds.getEast(),
                        bounds.getNorth()
                    ];
                    setSearchedBbox([
                        bounds.getWest(),
                        bounds.getSouth(),
                        bounds.getEast(),
                        bounds.getNorth()
                    ]);
                    displayItems(items, selectedFilters);
                    setSearchedBbox(null)
                });;

                observer.unobserve(mapContainer);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.01
    });

    observer.observe(mapContainer);

    const checkboxes = document.querySelectorAll('.form-check-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const group = checkbox.dataset.group;
            if (!selectedFilters[group]) {
                selectedFilters[group] = [];
            }
            if (checkbox.checked) {
                selectedFilters[group].push(checkbox.value);
            } else {
                selectedFilters[group] = selectedFilters[group].filter(value => value !== checkbox.value);
            }
            if (selectedFilters[group].length === 0) {
                delete selectedFilters[group];
            }
            displayItems(items, selectedFilters);
        });
    });
    
    $(function() {
        $('input[name="daterange"]').daterangepicker({
            "locale": {
                "format": "MM/DD/YYYY",
                "separator": " - ",
                "applyLabel": "Anwenden",
                "cancelLabel": "Abbrechen",
                "fromLabel": "Von",
                "toLabel": "bis",
                "customRangeLabel": "Custom",
                "weekLabel": "W",
                "daysOfWeek": [
                    "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"
                ],
                "monthNames": [
                    "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
                ],
                "firstDay": 1
            },
            opens: 'left',
            startDate: '01/01/2000',
            drops: "up",
            autoApply: true
        }, function(start, end, label) {
            selectedFilters['daterange'] = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
            displayItems(items, selectedFilters);
        });
    });
}

// Funktion um die Überprüfung der Bbox überlappung auszulagern
function checkBBoxOverlap(itemBBox, filterBBox){
    const [itemWest, itemSouth, itemEast, itemNorth] = itemBBox;
    const [filterWest, filterSouth, filterEast, filterNorth] = filterBBox;

    return !(itemEast < filterWest || itemWest > filterEast || itemNorth < filterSouth || itemSouth > filterNorth);
}

// Funktion um zu überprüfen ob die Dateranges mindestens ein Tag gemeinsam haben
function checkDateOverlap(itemStart, itemEnd, filterStart, filterEnd){
    const itemStartDate = new Date(itemStart);
    const itemEndDate = new Date(itemEnd);
    const filterStartDate = new Date(filterStart);
    const filterEndDate = new Date(filterEnd);

    return (
        (itemStartDate <= filterEndDate && itemStartDate >= filterStartDate) ||
        (itemEndDate >= filterStartDate && itemEndDate <= filterEndDate) ||
        (itemStartDate <= filterStartDate && itemEndDate >= filterEndDate)
    );
}
 
// Items anhand der angekreuzten Filterparameter filtern
function filterItems(items, filters){
    showAlert(0);
    let selectedItems = [];

    if (!filters || Object.keys(filters).length === 0) {
        return items;
    }

    items.forEach(item => {
        try {
            const properties = item.properties;
            let matchingValues = true;

            // Collection filtern
            if (filters.collection && filters.collection.length > 0) {
                if (!filters.collection.includes(item.collection_id)) {
                    matchingValues = false;
                }
            }

            // Frameworks filtern
            if (filters.frameworks && filters.frameworks.length > 0) {
                if (!filters.frameworks.includes(properties['mlm:framework'])) {
                    matchingValues = false;
                }
            }

            // Accelerators filtern
            if (filters.accelerators && filters.accelerators.length > 0) {
                if (!filters.accelerators.includes(properties['mlm:accelerator'])) {
                    matchingValues = false;
                }
            }

            // Tasks filtern
            if (filters.tasks && filters.tasks.length > 0) {
                if (!properties['mlm:tasks'].some(task => filters.tasks.includes(task))) {
                    matchingValues = false;
                }
            }

            // Input Name filtern
            if (filters.inputName && filters.inputName.length > 0) {
                if (!filters.inputName.includes(properties['mlm:input'][0]?.name)) {
                    matchingValues = false;
                }
            }

            // Architecture filtern
            if (filters.architecture && filters.architecture.length > 0) {
                if (!filters.architecture.includes(properties['mlm:architecture'])) {
                    matchingValues = false;
                }
            }

            // Batch Size filtern
            if (filters.batchSize && filters.batchSize.length > 0) {
                if (!filters.batchSize.includes(properties['mlm:batch_size_suggestion'])) {
                    matchingValues = false;
                }
            }

            // Pretrained Source filtern
            if (filters.pretrainedSource && filters.pretrainedSource.length > 0) {
                if (!filters.pretrainedSource.includes(properties['mlm:pretrained_source'])) {
                    matchingValues = false;
                }
            }

            // Bounding Box filtern
            if (filters.bbox && filters.bbox.length === 4) {
                const itemBBox = item.bbox;
                if (!checkBBoxOverlap(itemBBox, filters.bbox)) {
                    matchingValues = false;
                }
            }

            // Überprüfen ob mindestens ein Tag des Modells in der Filterrange liegt
            if (filters.daterange && filters.daterange.length === 2) {
                const [filterStart, filterEnd] = filters.daterange;
                if (!checkDateOverlap(properties.start_datetime, properties.end_datetime, filterStart, filterEnd)) {
                    matchingValues = false;
                }
            }
            

            if (matchingValues) {
                selectedItems.push(item);
            }
        } catch (error) {
            showAlert(1, "Nicht alle Modelle wurden betrachtet. Fehlerhaftes Modell: ", item.id);
        }
    });

    if (selectedItems.length === 0) {
        showAlert(2, "Keine Modelle gefunden.", "Nutze andere Suchparameter oder füge ein weiteres Modell mit deinen Anforderungen hinzu.");
    }

    return selectedItems;
}

// Funktion zum Anzeigen der Pretrained Variale im Frontend Modellkatalog
function isPretrained(bool,source){
    const boolean = bool
    const text = source
    if(boolean){
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg> <span>   </span><span>${source}</span>
        `
    }
    else{
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
            </svg>
        `
    }
}

// Funktion zum Checken ob User ein vortrainiertes Modell hochgeladen hat
function getPretrained(){
    const pretrained = document.getElementById('input-pretrained')
    if(pretrained.checked){
        return true;
    } else{
        return false;
    }
}

// Funktion zum Erstellen der individuellen Kartenansicht für jedes Modell
function createMapOnModell(data) {
    const item = data;
    const mapContainer = document.getElementById(`map-${item.id}`);
    // Observer für langsames Laden
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const map = L.map(`map-${item.id}`, {
                    center: [0, 0], 
                    zoom: 3, 
                    zoomControl: false,
                    scrollWheelZoom: false
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                }).addTo(map);

                const bbox = item.bbox || [];
                const searchedBbox = getSearchedBbox();

                if (bbox.length === 0 && !searchedBbox) {
                    document.getElementById(`map-${item.id}`).innerHTML = "Keine Kartenansicht verfügbar.";
                } else {
                    if (bbox.length === 4) {
                        const bounds = [
                            [bbox[1], bbox[0]],
                            [bbox[3], bbox[2]]
                        ];
                        L.rectangle(bounds, { color: "#ff7800", weight: 1 }).addTo(map);
                        map.fitBounds(bounds, { padding: [40, 40] });
                    }

                    if (searchedBbox) {
                        const searchedBounds = [
                            [searchedBbox[1], searchedBbox[0]],
                            [searchedBbox[3], searchedBbox[2]]
                        ];
                        L.rectangle(searchedBounds, { color: "#0000ff", weight: 1, fillOpacity: 0.1 }).addTo(map);
                        
                        // Wenn keine item.bbox vorhanden ist, zentrieren wir auf die gesuchte bbox
                        if (bbox.length === 0) {
                            map.fitBounds(searchedBounds, { padding: [40, 40] });
                        }
                    }
                }

                observer.unobserve(mapContainer);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.01
    });

    observer.observe(mapContainer);
}

// Funktion zum Anzeigen aller Modelle
function displayItems(items, filters) {
    const itemAmountContainer = document.getElementById('modell-itemamount-container');
    const container = document.getElementById('modell-container');
    container.innerHTML = '';
    const selectedFilters = filters;
    const filteredItems = filterItems(items, filters);
    const itemsPerPage = getItemAmount();
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (!document.getElementById('modell-itemamount')) {
        const amountItemsPerPage = document.createElement('div');
        amountItemsPerPage.id = 'modell-itemamount';
        amountItemsPerPage.classList.add('modell-itemamount');
        amountItemsPerPage.innerHTML = `
            <span style="font-weight:300;font-size:10px; margin: 7px;">Modelle pro Seite:</span>
            <form id="amountForm">
                <label class="modell-itemamount-button">
                    <input type="radio" onchange="displayItems(allItems)" name="itemAmount" value="5" checked style="display: none;">
                    <span class="button-visual">5</span>
                </label>
                <label class="modell-itemamount-button">
                    <input type="radio" onchange="displayItems(allItems)" name="itemAmount" value="10" style="display: none;">
                    <span class="button-visual">10</span>
                </label>
                <label class="modell-itemamount-button">
                    <input type="radio" onchange="displayItems(allItems)" name="itemAmount" value="25" style="display: none;">
                    <span class="button-visual">25</span>
                </label>
            </form>
        `;
        itemAmountContainer.appendChild(amountItemsPerPage);
    }

    for (let page = 1; page <= totalPages; page++) {
        const pageDiv = document.createElement('div');
        pageDiv.id = `page-${page}`;
        pageDiv.classList.add('page');
        pageDiv.style.display = page === 1 ? 'block' : 'none';

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);

        for (let i = startIndex; i < endIndex; i++) {
            const item = filteredItems[i];
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('p-3', 'modell-item');

            const title = document.createElement('span');
            title.innerHTML = `${item.properties['mlm:name']}`;
            title.style.color = `${item.color|| ''}`;

            const parameters = document.createElement('div');
            parameters.classList.add('modell-itemparameter');
            parameters.id = `modell-itemparameter-${item.id}`;
            parameters.innerHTML = `
                ${fillInParameters(item, selectedFilters)}
                <button type="button" class="btn-expand" data-bs-toggle="collapse" data-bs-target="#collapse-${item.id}" aria-expanded="false" aria-controls="collapse-${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left" viewBox="0 0 16 16">
                        <path d="M10 12.796V3.204L4.519 8zm-.659.753-5.48-4.796a1 1 0 0 1 0-1.506l5.48-4.796A1 1 0 0 1 11 3.204v9.592a1 1 0 0 1-1.659.753"/>
                    </svg>
                </button>
            `;

            const information = document.createElement('div');
            information.id = 'modell-itemcollapse';
            information.innerHTML = `
                <div class="collapse" id="collapse-${item.id}">
                    <div class="card card-body">
                        <div class="card-body-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-braces" viewBox="0 0 16 16">
                                <path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6"/>
                            </svg>
                            <span style="font-size: 10px;">${item.collection_id} /   </span><span style="font-size:20px; color:${item.color}">${item.properties['mlm:name']}</span>
                        </div>
                        <hr>
                        <div class="card-body-download">
                            <span style="font-size:15px;">Download:</span>
                            <br>
                            <span style="font-size:12px;">Für den Download des Items als JSON auf den Button klicken.</span>
                            <button type="button" class="btn-clipboard" onclick="downloadItemAsJSON('${item.id}')" id="download-${item.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#414243" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                </svg>
                            </button>
                        </div>
                        <hr>
                        <span style="font-size:15px;">Beschreibung:</span>
                        <span style="font-size:12px;">${item.properties.description}</span>
                        <hr>
                        <div class="card-body-download">
                            <span style="font-size:15px;">Einbinden:</span><br> <span style="font-size:12px;">${item.assets.model['href']}</span>
                                <button type="button" class="btn-clipboard" onclick="copyToClipboard('${item.assets.model['href']}', '${item.properties['mlm:name']}')" id="clipboard-${item.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#414243" class="bi bi-clipboard" viewBox="0 0 16 16">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                                    </svg>
                                </button>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-md-6 col-lg-8">
                                    <div style="font-size:12px;"class="card-body-parameters">
                                        <span>Tasks: ${item.properties['mlm:tasks'] || 'Unbekannt'} </span><br>
                                        <span>Empfohlener Zeitraum: ${item.properties.start_datetime || 'Unbekannt'} bis ${item.properties.end_datetime || 'Unbekannt'} </span><br>
                                        <span>Erwartete Eingabe: ${item.properties['mlm:input'][0].name || 'Unbekannt'} </span><br>
                                        <span>Eingabeeinschränkung: ${item.properties['mlm:input'][0].type || 'Unbekannt'}</span><br>
                                        <span>Accelerator: ${item.properties['mlm:accelerator'] || 'Unbekannt'} </span><br>
                                        <span>Architektur: ${item.properties['mlm:architecture'] || 'Unbekannt'}</span><br>
                                        <span>Framework: ${item.properties['mlm:framework'] || 'Unbekannt'} in der Version: ${item.properties['mlm:framework_version'] || 'Unbekannt'} </span><br>
                                        <span>Empfohlene Batchgröße: ${item.properties['mlm:batch_size_suggestion'] || 'Unbekannt'}
                                        <hr>
                                        <span>Weitere Information: ${item.properties['mlm:accelerator_summary'] || 'Keine weiteren Informationen hinterlegt.'} </span><br>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-4">
                                        <div style="width: 100%;height:100%;" id="map-${item.id}"></div>
                                </div>
                            </div>
                            <hr>
                            <span style="font-size:10px;">Vortrainiert: ${isPretrained(item.properties['mlm:pretrained'] || undefined, item.properties['mlm:pretrained_source'] || undefined)} </span>
                            <span style="font-size:10px;">Letztes Update: ${item['updated_at'] || 'Unbekannt'} </span>
                        </div>
                </div>
            `;

            itemDiv.appendChild(title);
            itemDiv.appendChild(parameters);
            itemDiv.appendChild(information);
            pageDiv.appendChild(itemDiv);

            const button = parameters.querySelector('.btn-expand');
            button.addEventListener('click', () => {
                const svg = button.querySelector('svg');
                if (button.getAttribute('aria-expanded') === 'true') {
                    svg.outerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-down" viewBox="0 0 16 16">
                            <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659"/>
                        </svg>
                    `;
                } else {
                    svg.outerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left" viewBox="0 0 16 16">
                            <path d="M10 12.796V3.204L4.519 8zm-.659.753-5.48-4.796a1 1 0 0 1 0-1.506l5.48-4.796A1 1 0 0 1 11 3.204v9.592a1 1 0 0 1-1.659.753"/>
                        </svg>
                    `;
                }
            });
        }

        container.appendChild(pageDiv);

        for (let i = startIndex; i < endIndex; i++) {
            const item = filteredItems[i];
            createMapOnModell(item);
        }
    }

    if (totalPages > 1) {
        const paginationButtons = document.createElement('div');
        paginationButtons.id = 'paginationButtons';
    
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => showPage(i));
            pageButton.classList.add('pageButton');
            pageButton.id = `pageButton-${i}`;
            if (i === 1) {
                pageButton.classList.add('activePageButton');
            }
            paginationButtons.appendChild(pageButton);
        }
    
        document.getElementById('modell-container').appendChild(paginationButtons);
    }

    // Funktion um eine gewisse Seite anzuzeigen
    function showPage(pageNumber) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.style.display = page.id === `page-${pageNumber}` ? 'block' : 'none';
        });

        const buttons = document.querySelectorAll('.pageButton');
        buttons.forEach(button => {
            button.classList.remove('activePageButton');
        });

        const activeButton = document.getElementById(`pageButton-${pageNumber}`);
        if (activeButton) {
            activeButton.classList.add('activePageButton');
        }
    }
}

// Funktion um Modell download zu starten 
function downloadItemAsJSON(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    const fileName = `${item.properties?.['mlm:name'] || item.id}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Funktion um Modell download zu starten 
function downloadDocument(filePath, fileName) {

    // Erstelle ein dynamisches <a>-Element
    const downloadAnchorNode = document.createElement('a');

    downloadAnchorNode.setAttribute("href", filePath); // Setzt den Dateipfad (z. B. "/path/to/file.py")
    downloadAnchorNode.setAttribute("download", fileName); // Setzt den Dateinamen für den Download

    // Füge das Element temporär zum DOM hinzu, klicke darauf und entferne es danach
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode); 

}

// Funktion um Modellparameter Schnellansicht je nach Auswahl der Filterparameter anpassen
function fillInParameters(item, data){
    const parameterMapping = [
        { mlmKey: 'mlm:tasks', filterKey: 'tasks' },
        { mlmKey: 'mlm:accelerator', filterKey: 'accelerators' },
        { mlmKey: 'mlm:framework', filterKey: 'frameworks' },
        { mlmKey: 'mlm:architecture', filterKey: 'architecture' },
        { mlmKey: 'mlm:pretrained_source', filterKey: 'pretrainedSource' }
    ];

    if (data !== undefined) {
        const activeFilters = Object.keys(data);
        const notFiltered = parameterMapping
            .filter(mapping => !activeFilters.includes(mapping.filterKey))
            .map(mapping => mapping.mlmKey);

        const displayParameters = notFiltered.slice(0, 3);

        if(displayParameters.length > 0){
            return `
            <span>
                ${displayParameters
                    .map(prop => item.properties[prop] || 'Unbekannt')
                    .join(' - ')}
            </span>
        `;
        } else{
            return `
            <span>
                ${item.properties['mlm:architecture'] || 'Unbekannt'} - 
                ${item.properties['mlm:framework'] || 'Unbekannt'} - 
                ${item.properties['mlm:accelerator'] || 'Unbekannt'}
            </span> 
        `;
        }

    } else {
        return `
            <span>
                ${item.properties['mlm:architecture'] || 'Unbekannt'} - 
                ${item.properties['mlm:framework'] || 'Unbekannt'} - 
                ${item.properties['mlm:accelerator'] || 'Unbekannt'}
            </span> 
        `;
    }
}

// Funktion um alle Filter zu clearen
function clearFilters(){
    selectedFilters = {}
    startWebsite()
    setTimeout(function(){
        showAlert(3, "Alle Filter entfernt.", "")}, 100)
}

// Funktion zum kopieren von Informationen in die Zwischenablage
function copyToClipboard(url_text, model_name) {
    navigator.clipboard.writeText(url_text).then(() => {
        showAlert(2, `Link des Modells <i>${model_name}</i> erfolgreich in die Zwischenablage kopiert.`, "");
    }).catch(err => {
        showAlert(1, `Link des Modells ${model_name} konnte nicht kopiert werden.`, "");
    });
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
        collection: new Set(),
        tasks: new Set(),
        frameworks: new Set(),
        accelerators: new Set(),
        inputName: new Set(),
        architecture: new Set(),
        batchSize: new Set(),
        pretrainedSource: new Set()
    };

    items.forEach(item => {
        const properties = item.properties;

        if (item.collection_id) {
            filters.collection.add(item.collection_id);
        }

        if (properties['mlm:tasks']) {
            properties['mlm:tasks'].forEach(task => filters.tasks.add(task));
        }

        if (properties['mlm:framework']) {
            filters.frameworks.add(properties['mlm:framework']);
        }

        if (properties['mlm:input'][0].name) {
            filters.inputName.add(properties['mlm:input'][0].name);
        }

        if (properties['mlm:accelerator']) {
            filters.accelerators.add(properties['mlm:accelerator']);
        }

        if (properties['mlm:pretrained_source']) {
            filters.pretrainedSource.add(properties['mlm:pretrained_source']);
        }

        if (properties['mlm:architecture']) {
            filters.architecture.add(properties['mlm:architecture']);
        }

        if (properties['mlm:batch_size_suggestion']) {
            filters.batchSize.add(properties['mlm:batch_size_suggestion']);
        }
    });

    return {
        tasks: Array.from(filters.tasks),
        frameworks: Array.from(filters.frameworks),
        accelerators: Array.from(filters.accelerators),
        pretrainedSource: Array.from(filters.pretrainedSource),
        accelerators: Array.from(filters.accelerators),
        collection: Array.from(filters.collection),
        inputName: Array.from(filters.inputName),
        architecture: Array.from(filters.architecture),
        batchSize: Array.from(filters.batchSize)
    };
}

// Funktion um Anmeldetabs bei erfolgreicher Anmeldung anzupassen
function successfulLoggedIn(user){
    const name = user.username
    const sidebarlogin = document.getElementById('sidebar-footerlink-login')
    const topbarlogin = document.getElementById('login-button')
    const tabContent = document.getElementById('authModal')
    sidebarlogin.innerHTML = ' '
    sidebarlogin.innerHTML = `<span>Bereits angemeldet: <strong style="text-transform: uppercase;">${name}</strong></span>`
    topbarlogin.innerHTML = ' '
    topbarlogin.innerHTML = `
            <button style="margin-top: 5px;" class="d-none d-md-block border-0 bg-transparent" type="button">
        <span style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1C3D86" class="bi bi-person-fill-check" viewBox="0 0 16 16">
            <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
            <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
            </svg>
            <span style="font-weight: bold; font-size:10px; color: #1C3D86;">${name}</span>
        </span>
        </button>
    `
    tabContent.innerHTML = ''
    tabContent.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-body">
                            <!-- Tab Content -->
                            <div class="tab-content mt-3" id="authTabContent">
                                <!-- Login Form -->
                                <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
                                    <div class="mb-4" style="font-weight: 300; font-size:20px; text-align: center; text-transform: uppercase; color: #1C3D86">
                                        Willkommen zurück, ${name}!
                                    </div>
                                    <hr>
                                    <form id="loginForm" style="text-align: center;">
                                        <div class="mb-3">
                                            <span>Accountinfo 1</span>
                                        </div>
                                        <div class="mb-3">
                                            <span>Accountinfo 2</span>
                                        </div>
                                        <hr>
                                        <button type="button" onclick="logoutUser()" class="btn-login p-2 w-100">Abmelden</button>
                                    </form>
                                    <div class="text-center text-muted" style="font-size:10px;margin-top:5px;">
                                        <span>Made by <img href="#" src="wthrdicon.svg" width="30px" height="30px"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

    `
}

// Funktion um Frontend nach dem Logout zurückzusetzen
function successfulLoggedOut(){
    const topbarlogin = document.getElementById('login-button')
    const tabContent = document.getElementById('authModal')
    const sidebarlogin = document.getElementById('sidebar-footerlink-login')

    topbarlogin.innerHTML =`
                                <button id="login-button" class="d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">
                                <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1C3D86" class="bi bi-person-circle" viewBox="0 0 16 16">
                                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                                </svg>
                                </span>
                            </button>
    `
    sidebarlogin.innerHTML=`
                <a id="sidebar-footerlink-login" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>

    `

    tabContent.innerHTML =`
                    <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-body">
                            <!-- Nav tabs innerhalb des Overlays -->
                            <ul class="nav nav-tabs nav-justified" id="authTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button" role="tab">Anmelden</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register" type="button" role="tab">Registrieren</button>
                                </li>
                            </ul>
                            <!-- Tab Content -->
                            <div class="tab-content mt-3" id="authTabContent">
                                <!-- Login Form -->
                                <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
                                    <form id="loginForm">
                                        <div class="mb-3">
                                            <input type="text" class="form-control overlay-input" id="login-username" placeholder="Nutzername">
                                        </div>
                                        <div class="mb-3">
                                            <input type="password" class="form-control overlay-input" id="login-password" placeholder="Passwort">
                                        </div>
                                        <button type="button" onclick="closeLoginTab(); loginUser()" class="btn-login p-2 w-100">Anmelden</button>
                                    </form>
                                    <div class="text-center text-muted" style="font-size:10px;margin-top:5px;">
                                        <span>Made by <img href="#" src="wthrdicon.svg" width="30px" height="30px"></span>
                                    </div>
                                </div>

                                <!-- Register Form -->
                                <div class="tab-pane fade" id="register" role="tabpanel" aria-labelledby="register-tab">
                                    <form id="registerForm">
                                        <div class="mb-3">
                                            <input type="text" class="form-control overlay-input" id="register-prename" placeholder="Vorname">
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" class="form-control overlay-input" id="register-lastname" placeholder="Nachname">
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" class="form-control overlay-input" id="register-username" placeholder="Nutzername">
                                        </div>
                                        <div class="mb-3">
                                            <input type="email" class="form-control overlay-input" id="register-email" placeholder="E-Mail">
                                        </div>
                                        <div class="mb-3">
                                            <input type="password" class="form-control overlay-input" id="register-password" placeholder="Passwort">
                                        </div>
                                        <button onclick="closeLoginTab(); registerUser()"class="btn-login p-2 w-100">Registrieren</button>
                                    </form>
                                    <div class="text-center text-muted" style="font-size:10px;margin-top:5px;">
                                        <span>Mit dem Registrieren bestätigt der Nutzer die geltenen <a href="#">AGB</a> sowie <a href="#">Nutzungsbedingungen</a> der jeweiligen Unterprodukte.</span><br>
                                    </div>
                                </div>
                            </div>
                        </div>

    `
}

function copyCodeToClipboard(button) {
    const codeBlock = button.previousElementSibling.querySelector("code");
    const text = codeBlock.innerText;

    navigator.clipboard.writeText(text).then(() => {
        button.textContent = "Kopiert!";
        setTimeout(() => {
            button.textContent = "Code kopieren";
        }, 2000);
    }).catch(err => {
        console.error("Fehler beim Kopieren: ", err);
    });
}