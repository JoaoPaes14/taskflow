import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../../core/models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: { login: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockResponse: AuthResponse = {
    token: 'tok',
    userId: 1,
    name: 'João',
    email: 'j@j.com',
    role: 'MEMBER',
  };

  beforeEach(async () => {
    auth = { login: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to dashboard on successful login', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    auth.login.mockReturnValue(of(mockResponse));
    component.email = 'j@j.com';
    component.password = '123456';
    component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'j@j.com', password: '123456' });
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show error message on failed login', () => {
    auth.login.mockReturnValue(throwError(() => ({ error: { message: 'Credenciais inválidas' } })));

    component.email = 'j@j.com';
    component.password = 'errada';
    component.onSubmit();

    expect(component.error()).toBe('Credenciais inválidas');
    expect(toast.error).toHaveBeenCalled();
  });

  it('should prevent double submission while a request is in flight', () => {
    auth.login.mockReturnValue({ subscribe: () => {} } as never);
    component.email = 'j@j.com';
    component.password = '123456';
    component.onSubmit();
    component.onSubmit();
    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it('should reset submitting on login failure', () => {
    auth.login.mockReturnValue(throwError(() => ({ error: { message: 'x' } })));
    component.onSubmit();
    expect(component.submitting()).toBe(false);
  });
});
