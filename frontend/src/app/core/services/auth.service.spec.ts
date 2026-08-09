import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated() should return false when no token is stored', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('login() should store token and user in localStorage', () => {
    const mockResponse = {
      _id: 'abc123',
      name: 'Test User',
      email: 'test@test.com',
      accessToken: 'fake-jwt-token',
      isAdmin: false,
      preferences: { theme: 'dark' }
    };

    service.login('test@test.com', 'password').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem('accessToken')).toBe('fake-jwt-token');
  });

  it('clearSession() should remove token and user from localStorage', () => {
    localStorage.setItem('accessToken', 'some-token');
    localStorage.setItem('user', JSON.stringify({ _id: '1', email: 'a@a.com' }));
    service.clearSession();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
