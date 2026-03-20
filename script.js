const csvUrl = 'locali.csv';
let localiData = [];
let activeFilters = [];
let userPos = null;

window.onload = () => {
    Papa.parse(csvUrl, {
        download: true, header: true, skipEmptyLines: true,
        complete: (results) => {
            localiData = results.data.filter(l => l.nome);
            renderLocali(localiData);
            autoGetLocation();
        }
    });
};

function autoGetLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => { userPos = { lat: pos.coords.latitude, lon: pos.coords.longitude }; updateDistances(); },
            () => { console.log("GPS Off"); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
}

function getLocation() { autoGetLocation(); }

function updateDistances() {
    if (!userPos) return;
    localiData.forEach(l => {
        if (l.lat && l.lng) l.distanzaKm = calculateDistance(userPos.lat, userPos.lon, parseFloat(l.lat), parseFloat(l.lng));
    });
    localiData.sort((a, b) => (a.distanzaKm || 999) - (b.distanzaKm || 999));
    const btn = document.querySelector('.btn-location');
    if (btn) { btn.innerHTML = "📍 Posizione Attiva"; btn.classList.add('active'); }
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
    activeFilters.includes(key) ? activeFilters = activeFilters.filter(f => f !== key) : activeFilters.push(key);
    applyFilters();
}

function applyFilters() {
    let filtered = localiData.filter(l => activeFilters.every(f => l[f] === 'Sì'));
    renderLocali(filtered);
}

function renderLocali(data) {
    const lista = document.getElementById('lista-locali');
    let html = ''; let countInRange = 0;
    data.forEach(l => {
        let distLabel = "";
        if (userPos && l.distanzaKm) {
            distLabel = `<span class="text-primary">• ${l.distanzaKm.toFixed(1)} km</span>`;
            if (l.distanzaKm <= 10) countInRange++;
        }
        html += `
            <div class="col-12 col-md-6 mb-3">
                <div class="card card-locale p-4 border-0">
                    <h5 class="fw-bold mb-1">${l.nome}</h5>
                    <p class="text-muted small mb-2">${l.indirizzo} ${distLabel}</p>
                    <div class="mb-3">
                        ${l.area_giochi_interna === 'Sì' ? '<span class="badge-kids">🏠 Giochi Interni</span>' : ''}
                        ${l.area_giochi_esterna === 'Sì' ? '<span class="badge-kids">🌳 Giochi Esterni</span>' : ''}
                        ${l.fasciatoio === 'Sì' ? '<span class="badge-kids">👶 Fasciatoio</span>' : ''}
                        ${l.tovagliette_da_colorare === 'Sì' ? '<span class="badge-kids">🖍️ Tovagliette</span>' : ''}
                        ${l.menu_bimbi === 'Sì' ? '<span class="badge-kids">🍝 Menù Bimbi</span>' : ''}
                    </div>
                    <button onclick="apriDettagli('${l.nome.replace(/'/g, "\\'")}')" class="btn btn-dettagli">🔍 FOTO E DETTAGLI</button>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nome + ' ' + l.indirizzo)}" target="_blank" class="btn-maps">PORTAMI QUI</a>
                </div>
            </div>`;
    });
    lista.innerHTML = html || '<p class="text-center mt-5">Nessun locale trovato.</p>';
    if (userPos) { document.getElementById('counter-container').classList.remove('d-none'); document.getElementById('n-locali').innerText = countInRange; }
}

function apriDettagli(nomeLocale) {
    const locale = localiData.find(l => l.nome === nomeLocale);
    if(!locale) return;
    document.getElementById('modalNomeLocale').innerText = locale.nome;
    document.getElementById('imgGiochiInterna').src = locale.foto_giochi_interna || 'img/no-photo.jpg';
    document.getElementById('imgGiochiEsterna').src = locale.foto_giochi_esterna || 'img/no-photo.jpg';
    document.getElementById('imgBagno').src = locale.foto_fasciatoio || 'img/no-photo.jpg';
    document.getElementById('imgKit').src = locale.foto_tovaglietta || 'img/no-photo.jpg';
    new bootstrap.Modal(document.getElementById('modalDettagli')).show();
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Impedisce a Chrome (Android) di mostrare il banner automatico brutto
    e.preventDefault();
    deferredPrompt = e;
    // Mostra il nostro banner personalizzato
    showInstallBanner("Installa ora");
});

window.addEventListener('load', () => {
    // Controllo speciale per iOS (Safari non supporta beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        showInstallBanner("Scopri come");
        document.getElementById('pwa-instruction').innerText = "Premi 'Condividi' e poi 'Aggiungi alla Home'";
        document.getElementById('btn-pwa-install').onclick = () => {
            alert("Su iPhone: premi il tasto 'Condividi' (quadrato con freccia) e seleziona 'Aggiungi alla schermata Home' 📲");
        };
    }
});

function showInstallBanner(btnText) {
    const banner = document.getElementById('pwa-install-banner');
    const btn = document.getElementById('btn-pwa-install');
    if (banner) {
        banner.classList.remove('d-none');
        btn.innerText = btnText;
    }
}

function closePwaBanner() {
    document.getElementById('pwa-install-banner').classList.add('d-none');
}

// Gestione click su Android
document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Utente ha installato KidsTable');
        }
        deferredPrompt = null;
        closePwaBanner();
    }
});

