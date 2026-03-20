const csvUrl = 'locali.csv';
let localiData = [];
let activeFilters = [];
let userPos = null;
const fallbackPhoto = 'img/no-photo.jpg';

window.onload = () => {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            localiData = results.data.filter(l => l.nome);
            renderLocali(localiData);
            // Proviamo a prendere la posizione subito, ma senza alert se fallisce
            autoGetLocation(true);
        }
    });
};

// Funzione principale per il GPS
function getLocation() {
    if (!navigator.geolocation) {
        alert("Il tuo browser non supporta la geolocalizzazione.");
        return;
    }

    const btn = document.querySelector('.btn-location');
    const helpBox = document.getElementById('gps-help');
    const helpIos = document.getElementById('help-text-ios');
    const helpAndroid = document.getElementById('help-text-android');

    btn.innerHTML = "⌛ Ricerca posizione...";
    helpBox.classList.add('d-none'); // Nascondi se era aperto

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            updateDistances();
            btn.innerHTML = "📍 Posizione Attiva";
            btn.classList.add('active');
            helpBox.classList.add('d-none'); // Tutto ok, nascondi aiuto
        },
        (err) => {
            btn.innerHTML = "📍 Cerca vicino a me";
            
            if (err.code === 1) { // PERMISSION_DENIED
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                helpBox.classList.remove('d-none');
                
                if (isIOS) {
                    helpIos.classList.remove('d-none');
                    helpAndroid.classList.add('d-none');
                } else {
                    helpAndroid.classList.remove('d-none');
                    helpIos.classList.add('d-none');
                }
            } else {
                alert("Non riesco a trovarti. Controlla che il GPS sia attivo nelle impostazioni del telefono.");
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Versione silenziosa per l'avvio
function autoGetLocation(silent = false) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => { 
                userPos = { lat: pos.coords.latitude, lon: pos.coords.longitude }; 
                updateDistances(); 
            },
            () => { if(!silent) console.log("GPS non autorizzato all'avvio"); },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }
}

function updateDistances() {
    if (!userPos) return;
    localiData.forEach(l => {
        if (l.lat && l.lng) {
            l.distanzaKm = calculateDistance(userPos.lat, userPos.lon, parseFloat(l.lat), parseFloat(l.lng));
        }
    });
    // Ordina per distanza
    localiData.sort((a, b) => (a.distanzaKm || 999) - (b.distanzaKm || 999));
    
    const btn = document.querySelector('.btn-location');
    if (btn) {
        btn.innerHTML = "📍 Posizione Attiva";
        btn.classList.add('active');
    }
    applyFilters();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toggleFilter(btn, key) {
    btn.classList.toggle('active');
    if (activeFilters.includes(key)) {
        activeFilters = activeFilters.filter(f => f !== key);
    } else {
        activeFilters.push(key);
    }
    applyFilters();
}

function applyFilters() {
    let filtered = localiData.filter(l => activeFilters.every(f => l[f] === 'Sì'));
    renderLocali(filtered);
}

function renderLocali(data) {
    const lista = document.getElementById('lista-locali');
    let html = ''; 
    let countInRange = 0;

    data.forEach(l => {
        let distLabel = "";
        if (userPos && l.distanzaKm) {
            distLabel = `<span class="text-primary">• ${l.distanzaKm.toFixed(1)} km</span>`;
            if (l.distanzaKm <= 10) countInRange++;
        }
        
        html += `
            <div class="col-12 col-md-6 mb-3">
                <div class="card card-locale p-4 border-0 shadow-sm">
                    <h5 class="fw-bold mb-1">${l.nome}</h5>
                    <p class="text-muted small mb-2">${l.indirizzo} ${distLabel}</p>
                    <div class="mb-3">
                        ${l.area_giochi_interna === 'Sì' ? '<span class="badge-kids">🏠 Giochi Interni</span>' : ''}
                        ${l.area_giochi_esterna === 'Sì' ? '<span class="badge-kids">🌳 Giochi Esterni</span>' : ''}
                        ${l.fasciatoio === 'Sì' ? '<span class="badge-kids">👶 Fasciatoio</span>' : ''}
                        ${l.tovagliette_da_colorare === 'Sì' ? '<span class="badge-kids">🖍️ Tovagliette</span>' : ''}
                        ${l.menu_bimbi === 'Sì' ? '<span class="badge-kids">🍝 Menù Bimbi</span>' : ''}
                    </div>
                    <button onclick="apriDettagli('${l.nome.replace(/'/g, "\\'")}')" class="btn btn-dettagli mb-2">🔍 FOTO E DETTAGLI</button>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}" target="_blank" class="btn-maps text-decoration-none">PORTAMI QUI</a>
                </div>
            </div>`;
    });

    lista.innerHTML = html || '<p class="text-center mt-5">Nessun locale trovato con questi filtri.</p>';
    
    const counterCont = document.getElementById('counter-container');
    if (userPos && counterCont) {
        counterCont.classList.remove('d-none');
        document.getElementById('n-locali').innerText = countInRange;
    }
}

function apriDettagli(nomeLocale) {
    const locale = localiData.find(l => l.nome === nomeLocale);
    if(!locale) return;

    document.getElementById('modalNomeLocale').innerText = locale.nome;
    
    // Gestione Foto con fallback su no-photo.jpg
    document.getElementById('imgGiochiInterna').src = locale.foto_giochi_interna || fallbackPhoto;
    document.getElementById('imgGiochiEsterna').src = locale.foto_giochi_esterna || fallbackPhoto;
    document.getElementById('imgBagno').src = locale.foto_fasciatoio || fallbackPhoto;
    document.getElementById('imgKit').src = locale.foto_tovaglietta || fallbackPhoto;

    const modalElement = document.getElementById('modalDettagli');
    const myModal = new bootstrap.Modal(modalElement);
    myModal.show();
}

// --- LOGICA PWA INSTALLAZIONE ---

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner("Installa ora");
});

window.addEventListener('load', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        showInstallBanner("Scopri come");
        const instruction = document.getElementById('pwa-instruction');
        if(instruction) instruction.innerText = "Premi 'Condividi' e poi 'Aggiungi alla Home'";
        
        const btnInstall = document.getElementById('btn-pwa-install');
        if(btnInstall) {
            btnInstall.onclick = () => {
                alert("Su iPhone: premi il tasto 'Condividi' (il quadrato con la freccia in alto) e seleziona 'Aggiungi alla schermata Home' 📲");
            };
        }
    }
});

function showInstallBanner(btnText) {
    const banner = document.getElementById('pwa-install-banner');
    const btn = document.getElementById('btn-pwa-install');
    if (banner && btn) {
        banner.classList.remove('d-none');
        btn.innerText = btnText;
    }
}

function closePwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if(banner) banner.classList.add('d-none');
}

document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('PWA installata con successo');
        deferredPrompt = null;
        closePwaBanner();
    }
});
