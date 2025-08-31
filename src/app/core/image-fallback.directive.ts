import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective implements OnInit {
  // Einfache Fallback-URLs ohne btoa() Probleme
  private menuItemFallback = 'data:image/svg+xml;charset=UTF-8,%3csvg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg"%3e%3crect x="130" y="80" width="140" height="140" fill="transparent" stroke="%23adb5bd" stroke-width="3" stroke-dasharray="15,10" rx="8"/%3e%3cpath d="M165 125 L235 125 L235 165 L225 175 L175 175 L165 165 Z M170 130 L190 130 L190 155 L170 155 Z M210 130 L230 130 L230 155 L210 155 Z" fill="%23adb5bd" stroke="%23adb5bd" stroke-width="1"/%3e%3c/svg%3e';

  private restaurantFallback = 'data:image/svg+xml;charset=UTF-8,%3csvg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg"%3e%3crect x="130" y="80" width="140" height="140" fill="transparent" stroke="%23adb5bd" stroke-width="3" stroke-dasharray="15,10" rx="8"/%3e%3cpath d="M170 135 L230 135 L230 170 L170 170 Z M180 140 L220 140 M180 145 L220 145 M180 150 L220 150 M180 155 L220 155 M180 160 L220 160" fill="none" stroke="%23adb5bd" stroke-width="2"/%3e%3c/svg%3e';

  @Input() appImageFallback: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    const img = this.el.nativeElement;

    // Setze Fallback sofort beim Initialisieren
    this.setFallbackImage();

    // Überwache auch das error event
    if (img.complete && img.naturalHeight === 0) {
      // Bild ist bereits geladen aber fehlerhaft
      this.setFallbackImage();
    }

    // Zusätzliche Sicherheit: Timeout für langsame/blo ckierte Bilder
    setTimeout(() => {
      if (img.naturalHeight === 0 && img.naturalWidth === 0 && !img.src.includes('data:image')) {
        console.log('Slow loading image detected, setting fallback:', img.alt);
        this.setFallbackImage();
      }
    }, 3000); // 3 Sekunden Timeout
  }

  private setFallbackImage() {
    const img = this.el.nativeElement;
    const altText = img.alt?.toLowerCase() || '';
    const className = img.className?.toLowerCase() || '';

    let fallbackUrl = this.menuItemFallback;

    if (altText.includes('restaurant') || className.includes('restaurant')) {
      fallbackUrl = this.restaurantFallback;
    }

    // Setze das Fallback als data-src oder direkt als src falls kein Bild geladen
    if (!img.src || img.src === '' || img.src.includes('undefined') || img.src.includes('null')) {
      console.log('Setting immediate fallback for:', altText);
      img.src = fallbackUrl;
    } else if (img.src.includes('unsplash.com') || img.src.includes('dummyimage.com')) {
      // Für externe Bilder: setze sofort ein Fallback als Backup
      const tempImg = new Image();
      tempImg.onload = () => {
        // Bild hat erfolgreich geladen - nichts tun
      };
      tempImg.onerror = () => {
        console.log('External image failed, setting fallback:', altText);
        img.src = fallbackUrl;
      };
      tempImg.src = img.src;
    }

    // Speichere das Fallback für error handling
    img.setAttribute('data-fallback', fallbackUrl);
  }

  @HostListener('error')
  onError() {
    const img = this.el.nativeElement;
    const fallbackUrl = img.getAttribute('data-fallback') || this.menuItemFallback;

    if (img.src !== fallbackUrl) {
      console.log('Setting fallback image:', fallbackUrl);
      img.src = fallbackUrl;
    }
  }
}
