import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  
  securityQuestions = [
    'What was your childhood nickname?',
    'What is the name of your favorite childhood friend?',
    'In what city or town did your mother and father meet?',
    'What is your favorite football team?',
    'What was the make of your first car?'
  ];
  selectedQuestion = '';
  securityAnswer = '';

  error = signal('');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit() {
    if (!this.email || !this.password || !this.confirmPassword || !this.selectedQuestion || !this.securityAnswer) return;
    // Custom domain check removed
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    this.authService.register(this.email, this.password, undefined, this.selectedQuestion, this.securityAnswer).subscribe({
      next: () => {
        // Auto login after register
        this.authService.login(this.email, this.password).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Registration failed.');
      }
    });
  }
}
