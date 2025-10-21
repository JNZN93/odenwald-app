import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective implements OnInit {
  @Input() fallbackSrc: string = '/assets/images/placeholder-food.jpg';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('error', () => {
      this.el.nativeElement.src = this.fallbackSrc;
    });
  }
}