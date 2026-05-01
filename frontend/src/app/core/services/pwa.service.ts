import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  showInstallButton = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI notify the user they can add to home screen
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.showInstallButton.set(false);
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });
  }

  installPwa() {
    if (!this.deferredPrompt) return;

    // Show the prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
    });
  }
}
