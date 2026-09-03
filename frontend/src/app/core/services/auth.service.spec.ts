import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockResponse: AuthResponse = {
    token: 'fake.jwt.token',
    userId: 1,
    name: 'João',
    email: 'joao@taskflow.com',
    role: 'MEMBER',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
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

  it('should call POST /api/auth/login and store the token', () => {
    service.login({ email: 'joao@taskflow.com', password: '123456' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.currentUser()).toEqual(mockResponse);
      expect(service.getToken()).toBe('fake.jwt.token');
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should call POST /api/auth/register and store the token', () => {
    service
      .register({ name: 'João', email: 'joao@taskflow.com', password: '123456' })
      .subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(service.isLoggedIn()).toBe(true);
      });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('João');
    req.flush(mockResponse);
  });

  it('should be logged out initially when no token stored', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should load user from token stored in localStorage', () => {
    localStorage.clear();
    const payload = btoa(JSON.stringify({ sub: '5', email: 'x@x.com' }));
    localStorage.setItem('taskflow_token', `${btoa('h')}.${payload}.${btoa('sig')}`);

    // Call loadFromStorage directly (singleton already instantiated in beforeEach)
    service['loadFromStorage']();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.currentUser()?.userId).toBe(5);
    expect(service.currentUser()?.email).toBe('x@x.com');
  });

  it('should clear token and user on logout', () => {
    localStorage.setItem('taskflow_token', 'abc');
    const mockUser: AuthResponse = { token: 'abc', userId: 1, name: 'João', email: 'j@j.com', role: 'MEMBER' };
    service['currentUser'].set(mockUser);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
