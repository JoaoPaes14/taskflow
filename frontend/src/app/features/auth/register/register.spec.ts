import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from './register';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../../core/models/auth.model';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let auth: { register: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockResponse: AuthResponse = {
    token: 'tok',
    userId: 1,
    name: 'João',
    email: 'j@j.com',
    role: 'MEMBER',
  };

  beforeEach(async () => {
    auth = { register: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to dashboard on successful registration', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    auth.register.mockReturnValue(of(mockResponse));
    component.name = 'João';
    component.email = 'j@j.com';
    component.password = '123456';
    component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith({ name: 'João', email: 'j@j.com', password: '123456' });
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show error message on failed registration', () => {
    auth.register.mockReturnValue(throwError(() => ({ error: { message: 'Email já em uso' } })));

    component.email = 'j@j.com';
    component.password = '123456';
    component.onSubmit();

    expect(component.error()).toBe('Email já em uso');
    expect(toast.error).toHaveBeenCalled();
  });

  it('should prevent double submission while a request is in flight', () => {
    auth.register.mockReturnValue({ subscribe: () => {} } as never);
    component.name = 'João';
    component.email = 'j@j.com';
    component.password = '123456';
    component.onSubmit();
    component.onSubmit();
    expect(auth.register).toHaveBeenCalledTimes(1);
  });

  it('should reset submitting on registration failure', () => {
    auth.register.mockReturnValue(throwError(() => ({ error: { message: 'x' } })));
    component.onSubmit();
    expect(component.submitting()).toBe(false);
  });
});
