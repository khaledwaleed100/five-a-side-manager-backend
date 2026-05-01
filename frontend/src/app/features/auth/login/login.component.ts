import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  isLoading = signal(false);

  onSubmit() {
    if (!this.email || !this.password) return;
    if (!this.email.endsWith('@five.com')) {
      this.error.set('Email must belong to the @five.com domain');
      return;
    }
    this.isLoading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/matches']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Login failed. Please check credentials.');
      }
    });
  }
}
