# Restaurant Flyer Generator

## Übersicht

Der Restaurant Flyer Generator ermöglicht es Restaurant Managern, professionelle Flyer in verschiedenen Papierformaten mit ihren bereits gepflegten Produktdaten zu erstellen.

## Features

### 📄 **Papierformat-Auswahl**
- **DIN A4** (210×297mm): Standard-Flyer Format - Sichere Zone: 10mm
- **DIN A5** (148×210mm): Kompaktes Format für Handzettel - Sichere Zone: 8mm
- **DIN A6** (105×148mm): Kleines Format für Postkarten - Sichere Zone: 5mm
- **DIN Lang** (110×220mm): Briefumschlag Format - Sichere Zone: 8mm
- **Visitenkarte** (85×55mm): Kleines Business Format - Sichere Zone: 3mm
- **Benutzerdefiniert**: Eigene Maße - Sichere Zone: 10mm

### 🖨️ **Professionelle Druckabstände**
- **Sichere Zone**: Automatische Berücksichtigung der Standard-Druckabstände
- **Beschnitt-Bereiche**: 2-3mm Beschnitt für professionellen Druck
- **PDF-Optimierung**: Korrekte @page-Margins für jeden Formattyp
- **Druckqualität**: Hochauflösende Darstellung mit korrekten Abständen

### 🎨 **Template-Auswahl**
- **Raster-Layout**: Produkte in einem übersichtlichen Raster angeordnet
- **Listen-Layout**: Produkte in einer kompakten Liste dargestellt  
- **Featured-Layout**: Produkte groß und prominent dargestellt

### 🛍️ **Produktauswahl**
- Auswahl einzelner Produkte oder ganzer Kategorien
- Vorschau der ausgewählten Produkte mit Bildern, Preisen und Beschreibungen
- Anzeige von Allergen-Informationen (Vegetarisch, Vegan, Glutenfrei)

### 🎨 **Anpassungsoptionen**
- **Restaurant-Informationen**: Name, Adresse, Telefon
- **Flyer-Einstellungen**: Titel, Untertitel, Farbschema
- **Farbschemata**: Klassisch, Modern, Elegant, Lebendig

### 📄 **Export-Optionen**
- **PDF-Download**: Direkter Download als PDF-Datei im gewählten Format
- **Drucken**: Direkter Druck über Browser
- **Als Bild speichern**: Export als PNG-Bild (mit html2canvas)

## Technische Implementierung

### Komponenten-Struktur
```
flyer-generator.component.ts
├── Template-Auswahl
├── Produktauswahl (nach Kategorien)
├── Anpassungsoptionen
├── Live-Vorschau
└── Export-Funktionen
```

### Integration
- Integriert in das Restaurant Manager Dashboard
- Route: `/restaurant-manager/flyer`
- Verwendet bestehende Restaurant- und Produktdaten

### PDF-Generierung
- HTML-zu-PDF Konvertierung über Browser-Print-API
- Unterstützung für verschiedene Papierformate (A4, A5, A6, DIN Lang, Visitenkarte)
- **Professionelle Druckabstände**: Automatische Berücksichtigung der sicheren Zone
- **@page-Margins**: Korrekte Seitenformatierung für jeden Formattyp
- Hochauflösende Darstellung für Druckqualität
- Responsive Layout für verschiedene Bildschirmgrößen

## Verwendung

1. **Format wählen**: Auswahl des gewünschten Papierformats
2. **Template wählen**: Auswahl zwischen Raster-, Listen- oder Featured-Layout
3. **Produkte auswählen**: Einzelne Produkte oder ganze Kategorien auswählen
4. **Anpassen**: Restaurant-Informationen und Design-Einstellungen konfigurieren
5. **Vorschau**: Live-Vorschau des Flyers im gewählten Format
6. **Export**: PDF herunterladen, drucken oder als Bild speichern

## Design-Features

### Farbschemata
- **Klassisch**: Dunkelblau/Grau mit Rot-Akzenten
- **Modern**: Helles Blau mit Orange-Akzenten
- **Elegant**: Lila/Violett mit Gold-Akzenten
- **Lebendig**: Rot mit Gelb-Akzenten

### Layout-Optionen
- **Grid**: 2-spaltiges Raster für kompakte Darstellung
- **List**: Einspaltige Liste für detaillierte Produktinformationen
- **Featured**: Großformatige Darstellung für besondere Produkte

## Technische Details

### Abhängigkeiten
- Angular 17+ (Standalone Components)
- Font Awesome Icons
- CSS Custom Properties für Theming
- Browser Print API für PDF-Generierung

### Browser-Kompatibilität
- Chrome/Edge: Vollständige Funktionalität
- Firefox: PDF-Export über Druckfunktion
- Safari: PDF-Export über Druckfunktion

### Performance
- Lazy Loading der Komponente
- Optimierte Bilddarstellung mit Fallback-Platzhaltern
- Effiziente Produktauswahl mit Checkbox-Gruppen

## Erweiterungsmöglichkeiten

### Geplante Features
- Mehr Template-Varianten
- QR-Code Integration für Online-Bestellung
- Social Media Integration
- Batch-Export für mehrere Flyer
- Vorlagen-Speicherung und -Wiederverwendung

### Technische Verbesserungen
- jsPDF Integration für bessere PDF-Qualität
- Canvas-basierte Bildgenerierung
- Drag & Drop für Produkt-Reihenfolge
- Real-time Collaboration für Team-Bearbeitung
