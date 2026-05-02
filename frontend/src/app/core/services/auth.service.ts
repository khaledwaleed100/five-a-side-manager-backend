import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  name?: string;
  email: string;
  preferences?: any;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);

  constructor() {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser && savedToken !== 'undefined' && savedToken !== 'null') {
      this.token.set(savedToken);
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        this.clearSession();
      }
    } else {
      this.clearSession();
    }
  }

  register(email: string, password: string, name?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password, name });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((res: any) => {
        this.token.set(res.accessToken);
        const user: User = { _id: res._id, name: res.name, email: res.email, preferences: res.preferences, isAdmin: res.isAdmin };
        this.currentUser.set(user);
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      }),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/login']);
        return of(null);
      })
    ).subscribe();
  }

  updateProfile(data: { name?: string; password?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data, { withCredentials: true }).pipe(
      tap((res: any) => {
        const user: User = { _id: res._id, name: res.name, email: res.email, isAdmin: res.isAdmin };
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resetpassword/${token}`, { password });
  }

  clearSession() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }
}
