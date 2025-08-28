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
    // Fallback deaktiviert: kein farbiger Hintergrund mehr
    const loading = document.getElementById('loading');
    if (loading && !loading.classList.contains('hidden')) {
        loading.classList.add('hidden');
        setTimeout(() => { loading.style.display = 'none'; }, 800);
    }
    const status = document.getElementById('status');
    if (status) status.textContent = 'Fallback deaktiviert';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[init.js] DOMContentLoaded');
    const status = document.getElementById('status');
    if (status) status.textContent = 'DOM bereit';

    function createPopup() {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.zIndex = '1003';
        wrapper.style.pointerEvents = 'auto';

        // zufällige Position innerhalb des Viewports
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const w = 360; // ca. Breite des Popups
        const h = 120; // ca. Höhe des Popups
        const left = Math.max(8, Math.min(vw - w - 8, Math.floor(Math.random() * (vw - w))));
        const top = Math.max(8, Math.min(vh - h - 8, Math.floor(Math.random() * (vh - h))));
        wrapper.style.left = left + 'px';
        wrapper.style.top = top + 'px';

        const panel = document.createElement('div');
        panel.style.position = 'relative';
        panel.style.background = '#ffffff';
        panel.style.color = '#000';
        panel.style.padding = '20px 48px 20px 20px';
        panel.style.borderRadius = '12px';
        panel.style.boxShadow = '0 10px 40px rgba(0,0,0,0.25)';
        panel.style.font = '700 20px/1.4 Arial, sans-serif';

        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Schließen');
        btn.textContent = '×';
        btn.style.position = 'absolute';
        btn.style.top = '8px';
        btn.style.right = '8px';
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.fontSize = '20px';
        btn.style.fontWeight = '700';
        btn.style.cursor = 'pointer';
        btn.style.lineHeight = '1';
        btn.style.color = '#000';

        const text = document.createElement('div');
        text.textContent = 'Jake Sandgeist, sie haben nicht im Lotto gewonnen.';

        btn.addEventListener('click', function() {
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
            // Beim Schließen zwei neue öffnen
            createPopup();
            createPopup();
        });

        panel.appendChild(btn);
        panel.appendChild(text);
        wrapper.appendChild(panel);
        document.body.appendChild(wrapper);
    }

    // vorhandenes zentrales Popup umrüsten: beim Schließen zwei neue
    const closeBtn = document.getElementById('popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const popup = document.getElementById('message-popup');
            if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            createPopup();
            createPopup();
        });
    } else {
        // Falls kein initiales Popup existiert, eines erzeugen
        createPopup();
    }
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


