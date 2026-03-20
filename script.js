/**
 * KidsTableTribe - Core Logic
 */

const csvUrl = 'locali.csv';
let localiData = [];
let activeFilters = [];
let userPos = null;

// 1. Caricamento Dati dal CSV
function loadLocals() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            // Pulizia dati: rimuoviamo righe corrotte o senza nome
            localiData = results.data.filter(l => l.nome && l.nome.trim() !== "");
            renderLocali(localiData);
        },
        error: (err) => {
            console.error("Errore PapaParse:", err);
            document.getElementById('lista-locali').innerHTML = `
                <div class="col-12 text-center p-5">
                    <p class="text-danger fw-bold">Impossibile caricare l'elenco dei locali. Verificare il file CSV.</p>
                </div>`;
        }
    });
}

// 2. Calcolo Distanza (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raggio della terra in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 3. Geolocalizzazione Utente
function getLocation() {
    const btn = document.querySelector('.btn-location');
    
    if (!navigator.geolocation) {
        alert("La geolocalizzazione non è supportata dal tuo browser.");
        return;
    }

    btn.innerHTML = "🌀 Calcolo in corso...";
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // ... (logica di successo uguale a prima)
            userPos = { lat: position.coords.latitude, lon: position.coords.longitude };
            localiData.forEach(l => {
                if(l.lat && l.lng) l.distanzaKm = calculateDistance(userPos.lat, userPos.lon, parseFloat(l.lat), parseFloat(l.lng));
            });
            localiData.sort((a, b) => a.distanzaKm - b.distanzaKm);
            btn.innerHTML = "📍 Vicino a te";
            btn.classList.add('success');
            applyFilters();
        },
        (error) => {
            // GESTIONE ERRORE SPECIFICA
            btn.innerHTML = "📍 Cerca vicino a me";
            
            let messaggio = "Per vedere i locali vicini, KidsTable ha bisogno della tua posizione.";
            
            // Rileva se è iPhone/iPad
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (error.code === error.PERMISSION_DENIED) {
                if (isIOS) {
                    messaggio = "⚠️ Accesso negato.\n\nPer attivarlo su iPhone:\n1. Vai in Impostazioni\n2. Privacy e sicurezza\n3. Localizzazione\n4. Safari (o il tuo browser)\n5. Seleziona 'Mentre usi l'app'";
                } else {
                    messaggio = "⚠️ Per favore, attiva i permessi di posizione nelle impostazioni del browser per ordinare i locali.";
                }
            }
            alert(messaggio);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// 4. Gestione Filtri (Toggle)
function toggleFilter(btn, filterKey) {
    btn.classList.toggle('active');
    
    if (activeFilters.includes(filterKey)) {
        activeFilters = activeFilters.filter(f => f !== filterKey);
    } else {
        activeFilters.push(filterKey);
    }
    
    applyFilters();
}

// 5. Applicazione Filtri e Render
function applyFilters() {
    let filtered = localiData;

    // Applica filtri incrociati (AND logic)
    if (activeFilters.length > 0) {
        filtered = localiData.filter(locale => {
            return activeFilters.every(f => locale[f] === 'Sì');
        });
    }

    renderLocali(filtered);
}

// 6. Generazione HTML delle Card
function renderLocali(data) {
    const lista = document.getElementById('lista-locali');
    const counterCont = document.getElementById('counter-container');
    const counterNum = document.getElementById('n-locali');
    
    let html = '';
    let countInRange = 0;

    if (data.length === 0) {
        lista.innerHTML = `<div class="col-12 text-center p-5"><p>Nessun locale corrisponde ai criteri selezionati. 🍼</p></div>`;
        if (userPos) counterNum.innerText = "0";
        return;
    }

    data.forEach(l => {
        // Conteggio per la dicitura "entro 10km"
        if (userPos && l.distanzaKm !== null && l.distanzaKm <= 10) {
            countInRange++;
        }

        const distInfo = (l.distanzaKm !== null && l.distanzaKm !== undefined) 
            ? `<span class="text-primary fw-bold ms-1">• ${l.distanzaKm.toFixed(1)} km</span>` 
            : '';

        html += `
            <div class="col-12 col-md-6 mb-3">
                <div class="card card-locale p-4 shadow-sm border-0">
                    <h5 class="fw-bold mb-1">${l.nome}</h5>
                    <p class="text-muted small mb-2">${l.indirizzo} ${distInfo}</p>
                    <div class="mb-3">
                        ${l.area_giochi === 'Sì' ? '<span class="badge-kids">🎡 Area Giochi</span>' : ''}
                        ${l.fasciatoio === 'Sì' ? '<span class="badge-kids">👶 Fasciatoio</span>' : ''}
                        ${l.menu_bimbi === 'Sì' ? '<span class="badge-kids">🍝 Menù Bimbi</span>' : ''}
                        ${l.animazione === 'Sì' ? '<span class="badge-kids">🎨 Animazione</span>' : ''}
                    </div>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}" 
                       target="_blank" 
                       class="btn-maps w-100 text-decoration-none">
                       PORTAMI QUI
                    </a>
                </div>
            </div>`;
    });

    lista.innerHTML = html;

    // Gestione contatore dinamico
    if (userPos) {
        counterCont.classList.remove('d-none');
        counterNum.innerText = countInRange;
    }
}

// Avvio automatico
window.onload = loadLocals;
