const csvUrl = 'locali.csv';
let localiData = [];

// Caricamento iniziale dei dati
function loadLocals() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            localiData = results.data;
            renderLocali(localiData);
        },
        error: function() {
            document.getElementById('lista-locali').innerHTML = `
                <div class="text-center p-5">
                    <p>Ops! Non riesco a caricare i locali. Controlla il file CSV.</p>
                </div>
            `;
        }
    });
}

// Formula di Haversine per calcolare la distanza
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// Funzione principale per la geolocalizzazione
function getLocation() {
    if (navigator.geolocation) {
        const btn = document.querySelector('.btn-location');
        const originalText = btn.innerHTML;
        btn.innerHTML = "🌀 Calcolo posizione...";
        
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            localiData.forEach(locale => {
                if(locale.lat && locale.lng) {
                    locale.distanzaKm = calculateDistance(userLat, userLon, parseFloat(locale.lat), parseFloat(locale.lng));
                } else {
                    locale.distanzaKm = 9999;
                }
            });

            localiData.sort((a, b) => a.distanzaKm - b.distanzaKm);
            renderLocali(localiData);
            
            btn.innerHTML = "📍 Ordinato per distanza";
            btn.classList.replace('btn-outline-primary', 'btn-success');
        }, (error) => {
            alert("Attiva la geolocalizzazione per vedere i locali più vicini.");
            btn.innerHTML = originalText;
        });
    }
}

// Funzione per mostrare i locali nell'HTML
function renderLocali(data) {
    let html = '';
    data.forEach(locale => {
        if(!locale.nome) return;
        
        let distText = locale.distanzaKm ? `<span class="ms-2 text-primary">• ${locale.distanzaKm.toFixed(1)} km</span>` : '';

        html += `
            <div class="col-12 col-md-6">
                <div class="card card-locale p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="mb-1">${locale.nome}</h5>
                    </div>
                    <p class="text-muted small mb-2">${locale.indirizzo} ${distText}</p>
                    <div class="mb-3">
                        ${locale.area_giochi === 'Sì' ? '<span class="badge-kids">🎡 Area Giochi</span>' : ''}
                        ${locale.fasciatoio === 'Sì' ? '<span class="badge-kids">👶 Fasciatoio</span>' : ''}
                        ${locale.menu_bimbi === 'Sì' ? '<span class="badge-kids">🍝 Menù Bimbi</span>' : ''}
                        ${locale.animazione === 'Sì' ? '<span class="badge-kids">🎨 Animazione</span>' : ''}
                    </div>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locale.nome + ' ' + locale.indirizzo)}" 
                       target="_blank" 
                       class="btn btn-primary w-100">
                       Calcola Percorso
                    </a>
                </div>
            </div>
        `;
    });
    document.getElementById('lista-locali').innerHTML = html;
}

let activeFilters = [];

function toggleFilter(btn, filterKey) {
    // Estetica del bottone
    btn.classList.toggle('active');
    
    // Gestione della lista filtri attivi
    if (activeFilters.includes(filterKey)) {
        activeFilters = activeFilters.filter(f => f !== filterKey);
    } else {
        activeFilters.push(filterKey);
    }
    
    // Applica il filtro ai dati originali
    applyFilters();
}

function applyFilters() {
    let filteredData = localiData;

    // Se ci sono filtri attivi, filtra l'array
    if (activeFilters.length > 0) {
        filteredData = localiData.filter(locale => {
            // Controlla se il locale ha "Sì" per TUTTI i filtri selezionati
            return activeFilters.every(filter => locale[filter] === 'Sì');
        });
    }

    renderLocali(filteredData);
}


// Avvio al caricamento della pagina
window.onload = loadLocals;
