/**
 * KidsTable - Auto-Location & Distances
 */

const csvUrl = 'locali.csv';
let localiData = [];
let activeFilters = [];
let userPos = null;

// 1. CARICAMENTO DATI E AVVIO AUTOMATICO
window.onload = () => {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            localiData = results.data.filter(l => l.nome && l.nome.trim() !== "");
            
            // Appena i dati sono pronti, proviamo a localizzare l'utente
            autoGetLocation();
        }
    });
};

// 2. TENTATIVO DI LOCALIZZAZIONE AUTOMATICA
function autoGetLocation() {
    if (navigator.geolocation) {
        // Chiediamo la posizione in modo silenzioso
        navigator.geolocation.getCurrentPosition(
            (position) => {
                successLocation(position);
            },
            (error) => {
                // Se fallisce (permessi non dati), mostriamo i locali senza distanza
                console.log("Posizione automatica negata o non disponibile.");
                renderLocali(localiData);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        renderLocali(localiData);
    }
}

// 3. LOGICA DI SUCCESSO (Usata sia all'avvio che al click del tasto)
function successLocation(position) {
    userPos = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };

    const btn = document.querySelector('.btn-location');

    // Calcolo KM per tutti
    localiData.forEach(l => {
        if (l.lat && l.lng) {
            l.distanzaKm = calculateDistance(userPos.lat, userPos.lon, parseFloat(l.lat), parseFloat(l.lng));
        }
    });

    // Ordina dal più vicino
    localiData.sort((a, b) => (a.distanzaKm || 999) - (b.distanzaKm || 999));

    if (btn) {
        btn.innerHTML = "📍 Vicino a te";
        btn.classList.add('success');
    }

    applyFilters();
}

// Funzione chiamata dal tasto manuale (per chi aveva negato i permessi all'inizio)
function getLocation() {
    autoGetLocation();
}

// 4. CALCOLO DISTANZA
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 5. GESTIONE FILTRI
function toggleFilter(btn, filterKey) {
    btn.classList.toggle('active');
    if (activeFilters.includes(filterKey)) {
        activeFilters = activeFilters.filter(f => f !== filterKey);
    } else {
        activeFilters.push(filterKey);
    }
    applyFilters();
}

function applyFilters() {
    let filtered = localiData;
    if (activeFilters.length > 0) {
        filtered = localiData.filter(locale => activeFilters.every(f => locale[f] === 'Sì'));
    }
    renderLocali(filtered);
}

// 6. RENDER CARD
function renderLocali(data) {
    const lista = document.getElementById('lista-locali');
    const counterCont = document.getElementById('counter-container');
    const counterNum = document.getElementById('n-locali');
    
    let html = '';
    let countInRange = 0;

    data.forEach(l => {
        // Controlliamo se è entro i 10km per il contatore
        if (userPos && l.distanzaKm <= 10) countInRange++;

        const distLabel = l.distanzaKm 
            ? `<span class="text-primary fw-bold ms-1">• ${l.distanzaKm.toFixed(1)} km</span>` 
            : '';

        html += `
            <div class="col-12 col-md-6 mb-3">
                <div class="card card-locale p-4 shadow-sm border-0">
                    <h5 class="fw-bold mb-1">${l.nome}</h5>
                    <p class="text-muted small mb-2">${l.indirizzo} ${distLabel}</p>
                    <div class="mb-3">
                        ${l.area_giochi === 'Sì' ? '<span class="badge-kids">🎡 Area Giochi</span>' : ''}
                        ${l.fasciatoio === 'Sì' ? '<span class="badge-kids">👶 Fasciatoio</span>' : ''}
                        ${l.menu_bimbi === 'Sì' ? '<span class="badge-kids">🍝 Menù Bimbi</span>' : ''}
                        ${l.animazione === 'Sì' ? '<span class="badge-kids">🎨 Animazione</span>' : ''}
                    </div>
                    <a href="tel:${l.telefono || ''}" class="btn w-100 mb-2 py-2" style="background-color: #2ecc71; color: white; border-radius: 12px; font-weight: 800; text-decoration: none; display: ${l.telefono ? 'block' : 'none'};">
                       📞 CHIAMA ORA
                    </a>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}" 
                       target="_blank" 
                       class="btn-maps w-100 text-decoration-none">
                       PORTAMI QUI
                    </a>
                </div>
            </div>`;
    });

    lista.innerHTML = html || '<p class="text-center mt-5">Nessun locale trovato con questi filtri.</p>';

    if (userPos) {
        counterCont.classList.remove('d-none');
        counterNum.innerText = countInRange;
    }
}
