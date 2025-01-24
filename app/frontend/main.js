let sharedDrawnItems = null;
let bboxString = null;
let usedFilters= null;

let startDatum = null;
let endDatum = null;

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

// Fassadenfunktion welche alle zum Start benötigten Funktionen ausführt
async function startWebsite(){
    const data = window.location.pathname.trim().toLowerCase();
    switch(data){
        case('/addmodel.html'):
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
                        console.log("Neue Range: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
                        startDatum = start;
                        endDatum = end;
                    });
                });
                const drawnItems = getDrawnItems();
                createInputForm(getExpectedInputs());
                const map = L.map('map').setView([0, 0], 2);

                map.on('draw:created', function (event) {
                    const layer = event.layer;
                    drawnItems.addLayer(layer);
                    const bounds = layer.getBounds();
                    console.log(bounds);
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
            setTimeout(function(){
                isLoggedIn()
            }, 50) 
        break;
        case('/catalog.html'):
            fetchItems();
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
            setTimeout(function(){
                isLoggedIn()
            }, 50)
        break;
    }
}
startWebsite();

// Schließt beim klicken des Anmelde/Register Buttons das Fenster ohne zu refreshen
function closeLoginTab() {
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

// Funktion zum Verwalten der gewollten Userinputs
function getExpectedInputs(){
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

// Funktion um Informationen zu den gewollten Userinputs zu verwalten
function getExpectedInputsInfo(){
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
        } else{
            showAlert(4, "Ungültige Anmeldedaten. Probiere es erneut.", "")
        }
    }
    catch(error){
        showAlert(4, "Fehler beim Anmelden.", "Passwort oder Nutzername falsch.")
    }
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
    console.log("Logged data:", logged);
    if (logged && logged.username && logged.id) {
        successfulLoggedIn(logged.username)
        return true;
    } else {
        return false;
    }
}

// Funktion um Standardansicht ohne Anmeldung zu generieren.
function createStandardView(){
    const sidebar = document.getElementById('sidebar')
    const main = document.getElementById('main-contentdesc')

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
            <a id="sidebar-footerlink-settings" href="#" class="nav-link">Settings</a>
        </div>
    </div>  
</nav>

`
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
            showAlert(3, "Erfolgreich registriert.")
        } else{
            showAlert(4, "Fehler bei der Registrierung. Nutze ggf. einen anderen Nutzername oder E-Mail.", "")
        }
    }
    catch(error){
        console.log(error)
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
            displayItems(data, undefined, 'asc');
            printAllFilters(data);
        } else {
            showAlert(4, "Fehler beim Abrufen der Items.", "Interner Fehler.")
        }
    } catch (error) {
        console.log(error)
        showAlert(4, "Fehler beim Abrufen der Items oder bei der Verbindung zum STAC.", "Überprüfe die Netzwerkverbindung.")
    }
}

// Adden des Items aus Eingabemaske
async function addItems() {
    const input = getUserInputs();
    try {
        const response = await fetch('http://localhost:8000/addItem/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        console.log("to add:", data);
    } catch (error) {
        console.log("Error aus addItems", error);
        showAlert(4, "Item konnte nicht hinzugefügt werden.", "");
    }
}

// Funktion um die Geometry auszugeben
function getGeometry() {
    const userInputs = getUserInputs()
    const geometry = userInputs.geometry
    return JSON.parse(geometry)
}

// Funktion um immer die aktuelle Bounding Box von der Karte zu extrahieren
function getBounds() {
    if(bboxString){
        const bounds = bboxString;
        console.log(bounds)
        return bounds.split(',').map(value => parseFloat(value.trim()));
    }else{
        return null;
    }
}

// Erstellt dynmaisch die gefragten Inputs für ein vollständiges Modell
function createInputForm(data) {
    const parameters = data;
    const container = document.getElementById('main-inputcontainer');
    const info = getExpectedInputsInfo();
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
            <button class="button-input" onclick="analyzeInput()"id="main-button-analyse">Analysieren</button>
            <button class="button-input" onclick="sendInput()"id="main-button-send">Abschicken</button>
        </div>
    `
    createDynamicInputs();
}

// Funktion um Tasks mit Dropdownmenü anzureichern
function createDynamicInputs() {
    const taskDiv = document.getElementById('input-tasks-div');
    taskDiv.innerHTML = ''
    const inputField = document.createElement('input');
    const dropdown = document.createElement('div');
    const tasks = getPredefinedTasks();

    inputField.setAttribute('class', 'main-inputwindow');
    inputField.setAttribute('id', 'input-tasks');
    inputField.setAttribute('placeholder', 'Tasks..');
    inputField.setAttribute('readonly', 'true');
    taskDiv.appendChild(inputField);

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

    inputField.addEventListener('click', () => {
        dropdown.style.cssText = 'max-width: 150px;'
        dropdown.style.display = dropdown.style.display === 'inherit' ? 'none' : 'inherit';
    });

    document.addEventListener('click', event => {
        if (!taskDiv.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Funktion um die ausgewählten Tasks in die Eingabemaske einzufügen
function updateSelectedTasks() {
    const checkboxes = document.querySelectorAll('#dropdown-options input:checked');
    const selectedTasks = Array.from(checkboxes).map(checkbox => checkbox.value);
    document.getElementById('input-tasks').value = selectedTasks.join(', ');
}

// Funktion um alle User Eingaben abzugreifen und in ein Array zu bündeln
function getUserInputs() {
    const expected = getExpectedInputs();
    const input = {};
    for (const p of expected) { 
        input[p] = document.getElementById('input-' + p).value; 
    }
    return input
}

//Funktion um den Inhalt des Input forms vor dem Abschicken zu analysieren
function analyzeInput(){
    const parameters = getExpectedInputs();
    const data = getUserInputs(); 
    const missing = [];
    parameters.forEach(parameter =>{
        if (data[parameter] === undefined || data[parameter] === null || data[parameter] === "") {
            missing.push(parameter)
        } else {
            return;
        }
    });
    const bounding = getBounds();
    const hex = document.getElementById("main-inputelem-color").value;
    const date = getDateRange();
    if (bounding === undefined || bounding === null || bounding === "") {
        console.log(bounding)
        missing.push('Bounding')
    }
    if (hex === undefined || hex === null || hex === "" || hex === '#000000') {
        missing.push('Color')
    }
    if (date === undefined || date === null || date === "") {
        missing.push('Date')
    }
    changeInputTOC(parameters, missing);
    return missing;
}

// Funktion um den Inputform abzusenden, falls korrekt gefüllt
function sendInput() {
    const missing = analyzeInput();

    if (missing.length > 0) {
        showAlert(4, "Bitte füllen Sie alle Eingabefelder korrekt aus.", "");
    } else {
        const userInputs = getUserInputs();
        console.log("SendInputs => addItems")
        addItems(); 
    }
}

// Funktion um ausgewählte Farbe beim hinzufügen eines Modells zu sichern
function getSelectedColor() {
    const colorInput = document.getElementById('main-inputelem-color');
    if (colorInput) {
        console.log("Farbcode:" + colorInput.value)
        return colorInput.value.toUpperCase();
    }
}

// Funktion zum dynamischen Erstellen des Inhaltsverzeichnisses mit Scrollfunktion
function createInputTOC(data) {
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
    
    // Footer hinzufügen
    sidebarList.innerHTML += ` 
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <li class="nav-item">
                <a id="sidebar-footerlink-login" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal" href="#">
                    Login
                </a>
            </li>
            <li class="nav-item">
                <a id="sidebar-footerlink-settings" class="nav-link" href="#">
                    Settings
                </a>
            </li>
        </div>`;
}

// Funktion zum anpassen vom Inhaltsverzeichnis des Inputsforms je nach Eingabe 
function changeInputTOC(data, pois){
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

    // Footer hinzufügen
    sidebarList.innerHTML += ` 
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <li class="nav-item">
                <a id="sidebar-footerlink-login" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal" href="#">
                    Login
                </a>
            </li>
            <li class="nav-item">
                <a id="sidebar-footerlink-settings" class="nav-link" href="#">
                    Settings
                </a>
            </li>
        </div>`;
}

// Funktion zum anzeigen aller verfügbaren unique Filtervalues in der Sidebar
function printAllFilters(items) {
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

    const toggleButton = `
        <button style="text-decoration:none;" class="d-md-none position-absolute top-0 end-0 m-2 btn btn-link p-0" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar" aria-controls="sidebar" aria-expanded="false" aria-label="Toggle Sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right" viewBox="0 0 16 16">
                <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
                </svg>
        </button>
    `;

    let selectedFilters = [];

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
            <span id="sidebar-groupheader" class="sidebar-heading d-flex mt-3 align-items-center">
                <button style="text-decoration:none;" class="btn btn-link toggle-collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1C3D86" class="bi bi-caret-down" viewBox="0 0 16 16">
                        <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659"/>
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
    
    const footer = `
        <div id="sidebar-footer" class="mt-auto">
            <hr>
            <a id="sidebar-footerlink-login" href="#" class="nav-link d-none d-md-block border-0 bg-transparent" type="button" data-bs-toggle="modal" data-bs-target="#authModal">Login</a>
            <a id="sidebar-footerlink-settings" href="#" class="nav-link">Settings</a>
        </div>
    `;
    
    sidebar.innerHTML += header + toggleButton + filterContent + footer;
    
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

    const toggleButtons = sidebar.querySelectorAll('.toggle-collapse-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const svg = button.querySelector('svg');
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                svg.innerHTML = `
                <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659"/>
                `;
            } else {
                svg.innerHTML = `
                    <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753"/>
                `;
            }
        });
    });
}
    
// Items anhand der angekreuzten Filterparameter filtern
function filterItems(items, filters) {
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

// Funktion zum erstellen der individuellen Kartenansicht für jedes Modell
function createMapOnModell(data) {
    const item = data;
    //console.log("test " + item.id);

    const mapContainer = document.getElementById(`map-${item.id}`);

    // Observer für langsames laden
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                //console.log("Lade Karte " + item.id);
                const map = L.map(`map-${item.id}`, {
                    center: [0, 0], 
                    zoom: 3, 
                    zoomControl: false,
                    scrollWheelZoom: false
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                }).addTo(map);

                const bbox = item.bbox || [];

                if (bbox.length === 0) {
                    document.getElementById(`map-${item.id}`).innerHTML = "Keine Kartenansicht verfügbar.";
                }

                if (bbox.length === 4) {
                    const bounds = [
                        [bbox[1], bbox[0]],
                        [bbox[3], bbox[2]]
                    ];
                    L.rectangle(bounds, { color: "#ff7800", weight: 1 }).addTo(map);

                    map.fitBounds(bounds, { padding: [40, 40] });
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
    const container = document.getElementById('modell-container');
    container.innerHTML = '';
    const selectedFilters = filters;
    const filteredItems = filterItems(items, filters);

    filteredItems.forEach(item => {
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
                information.id = 'modell-itemcollapse'
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
                container.appendChild(itemDiv);

                createMapOnModell(item);

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
    });      
}

// Funktion um Modellparameter Schnellansicht je nach Auswahl der Filterparameter anpassen
function fillInParameters(item, data) {
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
    const name = user
    const sidebarlogin = document.getElementById('sidebar-footerlink-login')
    const topbarlogin = document.getElementById('login-button')
    sidebarlogin.innerHTML = ' '
    sidebarlogin.innerHTML = `<span>Bereits angemeldet: <strong>${name}</strong></span>`
    topbarlogin.innerHTML = ' '
    topbarlogin.innerHTML = `<button style="margin-top: 5px;"class="d-none d-md-block border-0 bg-transparent" type="button"><span><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1C3D86" class="bi bi-check-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
  <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
</svg></span><br><span style="font-weight: bold; font-size:10px; color: #1C3D86; ">${name}</span></button>`
}
