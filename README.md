# Jake2 - Interaktive 3D Animation

Eine beeindruckende interaktive 3D-Animation inspiriert von modernen Webdesign-Trends, erstellt mit Three.js und WebGL.

## 🌟 Features

- **Interaktive 3D-Partikel**: Tausende von animierten Partikeln, die auf Maus- und Touch-Eingaben reagieren
- **Floating Spheres**: Glastransparente 3D-Kugeln mit realistischen Materialien und Beleuchtung
- **Touch-optimiert**: Vollständige Unterstützung für mobile Geräte mit Touch- und Orientierungssensoren
- **Responsive Design**: Automatische Anpassung an verschiedene Bildschirmgrößen
- **Performance-optimiert**: Intelligente Renderoptimierung für flüssige Animationen
- **Custom Cursor**: Interaktiver Cursor-Effekt für Desktop-Geräte

## 🚀 Live Demo

Die Animation ist live auf GitHub Pages verfügbar: [https://deinbenutzername.github.io/jake2/](https://deinbenutzername.github.io/jake2/)

## 🛠️ Technologie

- **Three.js** - 3D-Grafik-Engine
- **WebGL** - Hardware-beschleunigte 3D-Rendering
- **Responsive CSS** - Mobile-First Design
- **Vanilla JavaScript** - Keine zusätzlichen Abhängigkeiten
- **GitHub Pages** - Hosting

## 📱 Unterstützte Geräte

- ✅ Desktop Browser (Chrome, Firefox, Safari, Edge)
- ✅ Mobile Browser (iOS Safari, Chrome Mobile, Samsung Internet)
- ✅ Tablets (iPad, Android Tablets)
- ✅ Touch-Geräte mit Orientierungssensoren

## 🎮 Interaktionen

### Desktop:
- **Mausbewegung**: Kamera und Objekte folgen der Maus
- **Hover-Effekte**: Objekte reagieren beim Überfahren
- **Custom Cursor**: Weißer Punkt folgt der Maus

### Mobile:
- **Touch-Bewegung**: Ähnlich wie Mausbewegung auf Desktop
- **Geräteneigung**: Gyroscop-basierte Kamera-Steuerung
- **Touch-Interaktionen**: Direkte Manipulation der 3D-Szene

## ⚡ Performance

Die Animation ist für optimale Performance konfiguriert:
- Automatische Pixelratio-Anpassung
- Reduzierte Partikelanzahl auf mobilen Geräten
- Effiziente Shader-Programme
- Intelligentes Level-of-Detail System

## 🔧 Installation & Setup

1. Repository klonen:
```bash
git clone https://github.com/deinbenutzername/jake2.git
cd jake2
```

2. Lokal testen:
```bash
# Einfach index.html in einem modernen Browser öffnen
# Oder einen lokalen Server starten:
python -m http.server 8000
# Dann zu http://localhost:8000 navigieren
```

3. GitHub Pages aktivieren:
   - Repository-Einstellungen → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" (oder "master")
   - Folder: "/ (root)"

## 📁 Projektstruktur

```
jake2/
├── index.html              # Haupt-HTML-Datei
├── animation.js            # 3D-Animations-Logic
├── .github/
│   └── workflows/
│       └── pages.yml       # GitHub Pages Deployment
├── README.md               # Diese Datei
└── jake2.code-workspace    # VS Code Workspace
```

## 🎨 Anpassung

Die Animation kann einfach angepasst werden:

- **Farben**: Bearbeite die Farbwerte in `animation.js`
- **Partikelanzahl**: Ändere `particleCount` Variable
- **Bewegungsgeschwindigkeit**: Anpassung der `userData.floatSpeed` Werte
- **Kamera-Reaktivität**: Modifiziere die Interpolationsfaktoren

## 🐛 Browser-Kompatibilität

- **Chrome/Chromium**: ✅ Vollständig unterstützt
- **Firefox**: ✅ Vollständig unterstützt  
- **Safari**: ✅ Vollständig unterstützt (iOS 12+)
- **Edge**: ✅ Vollständig unterstützt
- **Internet Explorer**: ❌ Nicht unterstützt (WebGL erforderlich)

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe die LICENSE-Datei für Details.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue für Verbesserungsvorschläge.

---

**Erstellt mit ❤️ und Three.js**
