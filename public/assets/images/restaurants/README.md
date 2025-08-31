# Restaurant-Bilder für die Odenwald-App

Diese Sammlung von hochwertigen Stock-Fotos wird für die Darstellung der verschiedenen Restaurant-Typen in der Odenwald-App verwendet.

## Verfügbare Bilder

### Banner-Bilder (800x600px)
- **german-biergarten.jpg** - Traditioneller deutscher Biergarten mit Bierkrügen und gemütlicher Atmosphäre
- **german-schnitzel.jpg** - Deutsches Schnitzel mit Beilagen und traditioneller Küche
- **italian-pizzeria.jpg** - Italienische Pizzeria mit frischer Pizza und mediterranem Flair
- **asian-sushi.jpg** - Asiatisches Sushi-Restaurant mit Sushi, Sashimi und japanischer Küche
- **turkish-kebab.jpg** - Türkisches Kebab-Restaurant mit Döner und orientalischen Spezialitäten
- **american-burger.jpg** - Amerikanisches Burger-Restaurant mit saftigen Burgern und Pommes
- **placeholder-restaurant.jpg** - Generisches Restaurant-Interieur als Fallback

### Logo-Bilder (400x400px)
- **logo-german.jpg** - Logo für deutsche Restaurants mit Restaurant-Interieur
- **logo-italian.jpg** - Logo für italienische Restaurants mit Pizza-Motiv

## Bildquellen

Alle Bilder stammen von **Unsplash** und sind kostenlos für kommerzielle und nicht-kommerzielle Zwecke verwendbar:
- Hochauflösende Qualität (800x600px für Banner, 400x400px für Logos)
- Professionelle Food-Photography
- Verschiedene Küchentypen und Restaurant-Atmosphären
- Optimiert für Web-Anwendungen

## Verwendung

Die Bilder werden in den Restaurant-Komponenten über die `images` Property verwendet:

```typescript
images: {
  logo: '/assets/images/restaurants/logo-italian.jpg',
  banner: '/assets/images/restaurants/italian-pizzeria.jpg',
  gallery: ['/assets/images/restaurants/italian-pizzeria.jpg']
}
```

## Bildgrößen

- **Banner**: 800x600px - Für die Hauptansicht der Restaurant-Karten
- **Logo**: 400x400px - Für kleine Darstellungen und Icons
- **Gallery**: Verschiedene Größen - Für zusätzliche Ansichten

## Anpassung

Alle Bilder sind als hochauflösende JPG-Dateien erstellt und können einfach angepasst werden:
- Größen über CSS-Eigenschaften
- Bildqualität über verschiedene Auflösungen
- Einfache Integration in bestehende Designs

## Fallback

Falls ein Bild nicht geladen werden kann, wird automatisch `placeholder-restaurant.jpg` als Fallback verwendet.

## Bildbeschreibungen

- **Deutsche Küche**: Traditionelle Atmosphäre mit Biergarten-Flair und Schnitzel-Spezialitäten
- **Italienische Küche**: Mediterrane Pizzeria mit authentischen italienischen Gerichten
- **Asiatische Küche**: Moderne Sushi-Bars mit japanischen und asiatischen Spezialitäten
- **Türkische Küche**: Orientalische Kebab-Restaurants mit Döner und türkischen Gerichten
- **Amerikanische Küche**: Burger-Restaurants mit klassischen amerikanischen Speisen
