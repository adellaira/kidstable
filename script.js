const csvUrl = 'locali.csv';
let localiData = [];
let activeFilters = [];
let userPos = null; // Rimane null finché il GPS non risponde

// 1. CARICAMENTO DATI
window.onload = () => {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            localiData = results.data.filter(l => l.nome && l.nome.trim() !== "");
            renderLocali(localiData); // Prima visualizzazione senza KM
            autoGetLocation(); // Prova subito a chiedere il GPS
        }
    });
};

// 2. FUNZIONE GPS
function autoGetLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userPos = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                updateDistances();
            },
            (error) => {
                console.log("GPS non attivo o negato.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
}

// Chiamata dal tasto manuale
function getLocation() {
    autoGetLocation();
}

// 3. CALCOLO E ORDINAMENTO
function updateDistances() {
    if (!userPos) return;

    localiData.forEach(l => {
        if (l.lat && l.lng) {
            l.distanzaKm = calculateDistance(userPos.lat, userPos.lon, parseFloat(l.lat), parseFloat(l.lng));
        }
    });

    // Ordina per i più vicini
    localiData.sort((a, b) => (a.distanzaKm || 999) - (b.distanzaKm || 999));
    
    // Aggiorna il tasto per dare feedback
    const btn = document.querySelector('.btn-location');
    if (btn) {
        btn.innerHTML = "📍 Posizione Attiva";
        btn.classList.add('active');
    }

    applyFilters();
}

// 4. FORMULA MATEMATICA
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 5. FILTRI
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
        // Se il GPS è attivo (userPos non è null), mostriamo i KM blu
        let distLabel = "";
        if (userPos && l.distanzaKm) {
            distLabel = `<span class="text-primary fw-bold ms-1">• ${l.distanzaKm.toFixed(1)} km</span>`;
            if (l.distanzaKm <= 10) countInRange++;
        }

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

    // Mostra il contatore solo se il GPS ha dato una posizione
    if (userPos) {
        counterCont.classList.remove('d-none');
        counterNum.innerText = countInRange;
    }
}
