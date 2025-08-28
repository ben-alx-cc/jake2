console.log('[init.js] geladen');

function showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.innerHTML = `
            <div style="color: #ff6666; text-align: center;">
                <h3>Fehler beim Laden der Animation</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    background: #667eea; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 20px;
                ">Seite neu laden</button>
            </div>
        `;
    }
}

function activateFallback() {
    const container = document.getElementById('home-hero-visual-container');
    if (container) {
        container.innerHTML = '<div class="fallback-animation"></div>';
    }
    const loading = document.getElementById('loading');
    if (loading && !loading.classList.contains('hidden')) {
        loading.classList.add('hidden');
        setTimeout(() => { loading.style.display = 'none'; }, 800);
    }
    const status = document.getElementById('status');
    if (status) status.textContent = 'Fallback aktiv';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[init.js] DOMContentLoaded');
    const status = document.getElementById('status');
    if (status) status.textContent = 'DOM bereit';
    try {
        if (typeof THREE === 'undefined') {
            if (status) status.textContent = 'THREE fehlt';
            activateFallback();
            return;
        }
        if (typeof window.InteractiveExperience === 'undefined') {
            if (status) status.textContent = 'Experience fehlt';
            activateFallback();
            return;
        }
        if (status) status.textContent = 'Starte Experience';
        new window.InteractiveExperience();
        if (status) status.textContent = 'Läuft';
    } catch (e) {
        console.error(e);
        if (status) status.textContent = 'Fehler';
        showError(e && e.message ? e.message : 'Unbekannter Fehler');
        activateFallback();
    }
});


