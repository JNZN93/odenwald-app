# 🌍 Internationalisierung (i18n) für Restaurant Manager

## Übersicht

Die Restaurant Manager Anwendung unterstützt jetzt mehrsprachige Benutzeroberflächen mit Deutsch und Türkisch. Die Implementierung ist erweiterbar und ermöglicht es, einfach weitere Sprachen hinzuzufügen.

## 🚀 Implementierte Features

### ✅ Unterstützte Sprachen
- **Deutsch** (Standard)
- **Türkisch** (Türkçe)

### ✅ Übersetzte Bereiche
- Navigation (Übersicht, Bestellungen, Reklamationen, etc.)
- Statistiken (Heutige Bestellungen, Umsatz, etc.)
- Fehlermeldungen
- Allgemeine UI-Elemente (Speichern, Abbrechen, etc.)

### ✅ UI-Komponenten
- **Language Switcher**: Dropdown zur Sprachauswahl
- **Translate Pipe**: `{{ 'key' | translate }}` für Template-Übersetzungen
- **I18n Service**: Service für programmatische Übersetzungen

## 📁 Dateistruktur

```
frontend/src/app/
├── core/services/
│   └── i18n.service.ts              # Hauptservice für Übersetzungen
├── shared/
│   ├── pipes/
│   │   └── translate.pipe.ts       # Angular Pipe für Templates
│   └── components/
│       ├── language-switcher.component.ts  # Sprachauswahl-UI
│       └── i18n-demo.component.ts          # Demo-Komponente
└── features/restaurant-manager/
    └── restaurant-manager-dashboard.component.ts  # Aktualisierte Dashboard-Komponente
```

## 🔧 Verwendung

### 1. In Templates (HTML)
```html
<!-- Einfache Übersetzung -->
<h1>{{ 'nav.overview' | translate }}</h1>

<!-- Mit Parametern -->
<p>{{ 'stats.orders_today' | translate: {count: 15} }}</p>
```

### 2. In TypeScript-Komponenten
```typescript
import { I18nService } from '../../core/services/i18n.service';

export class MyComponent {
  private i18nService = inject(I18nService);

  getTranslatedText() {
    return this.i18nService.translate('common.save');
  }

  getTranslatedTextWithParams() {
    return this.i18nService.translate('stats.orders_today', { count: 15 });
  }
}
```

### 3. Sprachauswahl hinzufügen
```html
<app-language-switcher></app-language-switcher>
```

## 🌐 Neue Sprache hinzufügen

### Schritt 1: Übersetzungen in i18n.service.ts hinzufügen
```typescript
private translations: Translations = {
  de: { /* deutsche Übersetzungen */ },
  tr: { /* türkische Übersetzungen */ },
  en: { // Neue Sprache Englisch
    'nav.overview': 'Overview',
    'nav.orders': 'Orders',
    // ... weitere Übersetzungen
  }
};
```

### Schritt 2: Sprache in getAvailableLanguages() hinzufügen
```typescript
getAvailableLanguages(): { code: string; name: string }[] {
  return [
    { code: 'de', name: this.translate('lang.german') },
    { code: 'tr', name: this.translate('lang.turkish') },
    { code: 'en', name: this.translate('lang.english') }  // Neue Sprache
  ];
}
```

### Schritt 3: Sprachnamen übersetzen
```typescript
// In beiden Sprachen hinzufügen:
'lang.english': 'English',  // Deutsch
'lang.english': 'English', // Türkisch
'lang.english': 'English', // Englisch
```

## 📝 Übersetzungsschlüssel

### Navigation
- `nav.overview` - Übersicht
- `nav.orders` - Bestellungen
- `nav.issues` - Reklamationen
- `nav.support` - Support
- `nav.tables` - Tische
- `nav.drivers` - Fahrer
- `nav.menu` - Speisekarte
- `nav.flyer` - Flyer Generator
- `nav.details` - Details
- `nav.analytics` - Analytics
- `nav.customers` - Kunden
- `nav.settings` - Einstellungen
- `nav.wholesale` - Großhandel Einkauf

### Statistiken
- `stats.orders_today` - Heutige Bestellungen
- `stats.revenue_today` - Umsatz heute
- `stats.avg_order_value` - Ø Bestellwert
- `stats.orders_week` - Bestellungen diese Woche
- `stats.no_data` - Keine Daten verfügbar
- `stats.vs_yesterday` - vs gestern
- `stats.vs_last_week` - vs letzte Woche

### Allgemeine UI
- `common.loading` - Lädt...
- `common.error` - Fehler
- `common.save` - Speichern
- `common.cancel` - Abbrechen
- `common.delete` - Löschen
- `common.edit` - Bearbeiten
- `common.add` - Hinzufügen
- `common.search` - Suchen
- `common.filter` - Filter
- `common.reset` - Zurücksetzen
- `common.confirm` - Bestätigen
- `common.yes` - Ja
- `common.no` - Nein

### Fehlermeldungen
- `error.restaurants_load` - Restaurants konnten nicht geladen werden
- `error.stats_load` - Restaurant-Statistiken konnten nicht geladen werden

## 🎯 Nächste Schritte

### Erweiterte Features
1. **Mehr Komponenten übersetzen**: Weitere Restaurant Manager Komponenten
2. **Datum/Zeit Lokalisierung**: Angular DatePipe mit Locale-Unterstützung
3. **Zahlformatierung**: CurrencyPipe und DecimalPipe mit Locale
4. **RTL-Unterstützung**: Für arabische/hebräische Sprachen
5. **Lazy Loading**: Übersetzungen nur bei Bedarf laden

### Weitere Sprachen
- **Englisch** (English)
- **Französisch** (Français)
- **Italienisch** (Italiano)
- **Spanisch** (Español)
- **Arabisch** (العربية)

## 🔍 Demo

Die `I18nDemoComponent` zeigt alle verfügbaren Übersetzungen und die Sprachauswahl-Funktionalität. Sie kann in jeder Route eingebunden werden, um die i18n-Features zu demonstrieren.

## 💾 Persistierung

Die gewählte Sprache wird im `localStorage` gespeichert und beim nächsten Besuch automatisch wiederhergestellt.

## 🚀 Build & Deployment

Die i18n-Funktionalität ist vollständig in den Angular Build-Prozess integriert und funktioniert sowohl im Development- als auch im Production-Modus.
