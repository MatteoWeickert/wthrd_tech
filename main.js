// Fassadenfunktion welche alle zum Start benötigten Funktionen ausführt
function startWebsite(){
    fetchItems();
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
            displayItems(data);
        } else {q
            showAlert(4, "Fehler beim Abrufen der Items.", "Überprüfe die Netzwerkverbindung.")
        }
    } catch (error) {
        showAlert(4, "Fehler beim Abrufen der Items oder bei der Verbindung zum STAC.", "Überprüfe die Netzwerkverbindung.")
    }
}

// Funktion zum Anzeigen aller Modelle
function displayItems(items) {
    const container = document.getElementById('modell-container');
    container.innerHTML = '';

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('p-3', 'modell-item');

        const title = document.createElement('span');
        title.innerHTML = `${item.properties.title || 'Unbekannter Titel'}`;

        const parameters = document.createElement('div');
        parameters.classList.add('modell-itemparameter');
        parameters.id = `modell-itemparameter-${item.id}`;
        parameters.innerHTML = `
            ${decideOnParameters(item)}
            <button id="btn-expand" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${item.id}" aria-expanded="false" aria-controls="collapse-${item.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-angle-expand" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"/>
                </svg>
            </button>
        `;

        const information = document.createElement('div');
        information.id = 'modell-itemcollapse'
        information.innerHTML = `
            <div class="collapse" id="collapse-${item.id}">
                <div class="card card-body">
                    <span style="font-size:20px;">${item.properties.title}</span>
                    <span style="font-size:10px;">${item.properties['mlm:name']}</span>
                    <hr>
                    <span style="font-size:15px;">Beschreibung:</span>
                    <span style="font-size:10px;">${item.properties.description}</span>
                    <hr>
                    <span>Tasks: ${item.properties['mlm:tasks'] || 'Unbekannt'} </span>
                    <span>Framework: ${item.properties['mlm:framework'] || 'Unbekannt'} </span>
                    <span>Tasks: ${item.properties['mlm:tasks'] || 'Unbekannt'} </span>
                    <span>Tasks: ${item.properties['mlm:tasks'] || 'Unbekannt'} </span>
                    <span>Tasks: ${item.properties['mlm:tasks'] || 'Unbekannt'} </span>
                    <span>Link: ${item.assets.data['href'] || 'Unbekannt'} </span>
                    <hr>
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


// Funktion um anzuzeigende Informationen zu den Modellen zu generieren
function decideOnParameters(item){
    //filters = getCurrentFilters();
    return `           <span>
                ${item.properties['mlm:tasks'] || ''} - 
                ${item.properties['mlm:framework'] || ''} - 
                ${item.assets.data['href'] || 'Kein Link'}
            </span>`     
}

// Funktion zum erstellen von dynmaischen Alerts 1 Warnung 2 Info 3 Erfolg 4 Error
function showAlert(type, text, optional){
    alertContainer = document.getElementById('main-alert')
    switch(type){
        case(1): // WARNING
            alertContainer.innerHTML = `                            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                                <strong>Warnung:</strong> ${text} ${optional}
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