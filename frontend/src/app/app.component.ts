import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  pwaService = inject(PwaService);
  title = '5-A-Side Manager';

  showScrollTop = signal(false);
  showPwaBanner = signal(false);
  pwaBannerDismissed = false;

  constructor() {
    // Show PWA banner after a delay if install button is available & not dismissed
    setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        this.showPwaBanner.set(true);
      }
    }, 3000);
  }

  @HostListener('window:scroll', [])
  onScroll() {
    this.showScrollTop.set(window.scrollY > 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  dismissPwaBanner() {
    this.showPwaBanner.set(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  }

  installAndDismiss() {
    this.pwaService.installPwa();
    this.dismissPwaBanner();
  }
}
