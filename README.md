# 🎨 Frontend - Angular 18 Anwendung

## 🚀 Übersicht

Das Frontend der ODNWLD liefert App ist eine moderne Angular 18 Anwendung, die alle Funktionen einer Food-Delivery-Plattform bereitstellt. Die Anwendung nutzt moderne Angular APIs, ist vollständig responsive und bietet eine intuitive Benutzeroberfläche für alle Benutzerrollen.

## ✨ Hauptmerkmale

- **Angular 18** mit neuesten Features und APIs
- **Standalone Components** für bessere Modularität
- **Responsive Design** für alle Geräte (Desktop, Tablet, Mobile)
- **JWT-basierte Authentifizierung** mit sicheren Guards
- **Feature-basierte Architektur** für bessere Wartbarkeit
- **TypeScript** für typsicheren Code
- **SCSS** für moderne Styling-Möglichkeiten

## 🏗️ Architektur

### Core Module (`src/app/core/`)
- **Authentication Service** - JWT-Verwaltung und Login/Logout
- **Auth Guard** - Geschützte Routen und Rollenverwaltung
- **JWT Interceptor** - Automatische Token-Behandlung
- **Restaurants Service** - API-Kommunikation für Restaurant-Daten
- **Global Services** - Wiederverwendbare Funktionalitäten

### Feature Modules (`src/app/features/`)
- **Admin Module** - Plattform-Verwaltung und Analytics
- **Customer Module** - Kunden-Dashboard und Bestellhistorie
- **Restaurants Module** - Restaurant-Liste und Speisekarten mit uncategorized Items Support
- **Shopping Module** - Warenkorb und Checkout-Prozess

### Shared Module (`src/app/shared/`)
- **Wiederverwendbare Komponenten** - Buttons, Forms, Cards
- **Pipes** - Datenformatierung und -transformation
- **Directives** - Benutzerdefinierte DOM-Manipulation
- **Interfaces** - TypeScript-Typdefinitionen

## 🎯 Funktionalitäten

### 🔐 Authentifizierung
- **Registrierung** neuer Benutzer
- **Login** mit E-Mail und Passwort
- **JWT-Token-Verwaltung** mit automatischer Erneuerung
- **Rollenbasierte Zugriffskontrolle** (Admin, Manager, Fahrer, Kunde)
- **Geschützte Routen** mit Route Guards

### 🏪 Restaurant-Bereich
- **Restaurant-Liste** mit Filtern und Suche
- **Restaurant-Details** mit vollständigen Informationen
- **Speisekarten-Anzeige** mit Kategorien
- **Automatische Handhabung** von uncategorized Gerichten
- **"Weitere Gerichte" Kategorie** für Items ohne Kategorie
- **Gerichte-Filterung** nach Ernährungspräferenzen
- **Bewertungen und Reviews** für Restaurants

### 🛒 Shopping-Bereich
- **Warenkorb-Verwaltung** mit Mengenänderungen
- **Checkout-Prozess** mit Adress- und Zahlungsdaten
- **Bestellbestätigung** mit Tracking-Informationen
- **Bestellverfolgung** in Echtzeit
- **Bestellhistorie** mit detaillierten Informationen

### 👤 Kunden-Bereich
- **Persönliches Dashboard** mit Übersicht
- **Profilverwaltung** und Einstellungen
- **Lieferadressen** verwalten
- **Zahlungsmethoden** speichern
- **Favoriten-Restaurants** markieren

### 🚗 Fahrer-Bereich
- **Verfügbare Aufträge** anzeigen
- **Auftragsannahme** und -verwaltung
- **Status-Updates** für Bestellungen
- **Route-Informationen** und Navigation
- **Einnahmen-Übersicht** (zukünftige Funktion)

### 📊 Admin-Bereich
- **Mandantenverwaltung** für Multi-Tenant-Support
- **Benutzerverwaltung** mit Rollenvergabe
- **Restaurant-Übersicht** und Statistiken
- **System-Monitoring** und Performance
- **Analytics-Dashboard** (zukünftige Funktion)

## 🛠️ Technische Details

### Dependencies
```json
{
  "@angular/animations": "^18.2.0",
  "@angular/common": "^18.2.0",
  "@angular/compiler": "^18.2.0",
  "@angular/core": "^18.2.0",
  "@angular/forms": "^18.2.0",
  "@angular/platform-browser": "^18.2.0",
  "@angular/router": "^18.2.0",
  "rxjs": "~7.8.0"
}
```

### Entwicklungstools
- **Angular CLI 18.2.20** für Projektverwaltung
- **TypeScript 5.5.2** für typsicheren Code
- **SCSS** für erweiterte CSS-Funktionalitäten
- **Jasmine & Karma** für Unit-Tests
- **Cypress** für End-to-End-Tests

## 🚀 Entwicklung

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- Angular CLI (global installiert)

### Installation
```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start

# Build erstellen
npm run build

# Tests ausführen
npm test
```

### Entwicklungsserver
```bash
npm start
```
Die Anwendung läuft dann unter `http://localhost:4200/`

### Build
```bash
# Development Build
npm run build

# Production Build
npm run build --configuration production

# Watch Mode
npm run watch
```

## 🔧 Konfiguration

### Proxy-Konfiguration
Die `proxy.conf.json` leitet alle `/api` Requests an den Backend-Server weiter:
```json
{
  "/api": {
    "target": "http://localhost:4000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Umgebungsvariablen
- **Development**: `environment.ts`
- **Production**: `environment.prod.ts` (wird beim Build erstellt)

### Angular-Konfiguration
- **Port**: 4200 (konfigurierbar in `angular.json`)
- **Proxy**: Aktiviert für API-Calls
- **Source Maps**: Aktiviert für besseres Debugging

## 🧪 Testing

### Unit Tests
```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Mode
npm test -- --watch

# Tests mit Coverage
npm test -- --code-coverage
```

### End-to-End Tests
```bash
# Cypress Tests starten
npx cypress open

# Cypress Tests im Headless-Mode
npx cypress run
```

### Test-Struktur
- **Unit Tests**: Für Services, Components und Pipes
- **Integration Tests**: Für Module und Feature-Interaktionen
- **E2E Tests**: Für vollständige Benutzer-Workflows

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Ansatz
- Alle Komponenten sind von Grund auf mobil-optimiert
- Progressive Enhancement für größere Bildschirme
- Touch-freundliche Bedienelemente

## 🔒 Sicherheit

### JWT-Handling
- **Automatische Token-Erneuerung** vor Ablauf
- **Sichere Speicherung** im Local Storage
- **Automatische Logout** bei ungültigen Tokens

### XSS-Schutz
- **Angular's eingebaute XSS-Schutz** aktiviert
- **Content Security Policy** konfiguriert
- **Input-Validierung** für alle Formulare

## 🚀 Performance

### Optimierungen
- **Lazy Loading** für Feature-Module
- **OnPush Change Detection** für bessere Performance
- **TrackBy-Funktionen** für ngFor-Loops
- **Pure Pipes** für effiziente Datenverarbeitung

### Bundle-Optimierung
- **Tree Shaking** für ungenutzten Code entfernen
- **Code Splitting** für kleinere Chunks
- **Minification** für Production-Builds

## 🔮 Zukünftige Features

### Geplante Erweiterungen
- **PWA-Support** für Offline-Funktionalität
- **Push-Benachrichtigungen** für Bestellungen
- **Real-time Updates** mit WebSockets
- **Offline-Synchronisation** für bessere UX
- **Dark Mode** für bessere Zugänglichkeit

### Performance-Verbesserungen
- **Service Worker** für Caching
- **Virtual Scrolling** für große Listen
- **Image Lazy Loading** für bessere Ladezeiten
- **Preloading** für kritische Routen

## 📚 Dokumentation

### Code-Dokumentation
- **JSDoc-Kommentare** für alle öffentlichen Methoden
- **TypeScript-Interfaces** für alle Datenstrukturen
- **README-Dateien** in jedem Feature-Modul

### API-Dokumentation
- **Swagger/OpenAPI** Integration (geplant)
- **Postman Collections** für API-Tests
- **Beispiel-Requests** in der Dokumentation

## 🤝 Beitragen

### Entwicklung
1. **Feature-Branch** erstellen
2. **TypeScript-Standards** befolgen
3. **Unit Tests** für neue Funktionalitäten
4. **Linting** und Formatierung prüfen

### Code-Standards
- **Angular Style Guide** befolgen
- **TypeScript strict mode** aktiviert
- **ESLint** Regeln einhalten
- **Prettier** für konsistente Formatierung

---

**Entwickelt mit Angular 18 für moderne Web-Anwendungen** 🚀
