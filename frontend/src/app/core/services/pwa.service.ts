import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  // Always show by default so iOS/Desktop users can see the fallback instructions
  showInstallButton = signal(true);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.showInstallButton.set(false);
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });

    // Hide button if already installed (running in standalone mode)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.showInstallButton.set(false);
    }
  }

  installPwa() {
    if (!this.deferredPrompt) {
      // Fallback instructions for iOS Safari or browsers blocking the prompt
      alert('📥 How to Install:\n\n📱 iOS (Safari): Tap the Share button at the bottom and select "Add to Home Screen".\n\n🤖 Android / Desktop: Look for the Install icon in your address bar, or use "Install App" in your browser menu.');
      return;
    }

    // Show the native prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond
    this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
        this.showInstallButton.set(false);
      }
      this.deferredPrompt = null;
    });
  }
}
