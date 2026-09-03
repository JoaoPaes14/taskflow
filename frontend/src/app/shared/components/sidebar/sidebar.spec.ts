import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let auth: AuthService;

  const mockUser: AuthResponse = {
    token: 'token',
    userId: 1,
    name: 'João',
    email: 'joao@taskflow.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([{ path: 'login', component: DummyComponent }]),
        AuthService,
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the user name', () => {
    auth['currentUser'].set(mockUser);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('João');
  });

  it('should have a dashboard navigation link', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[routerlink="/dashboard"]')).toBeTruthy();
  });

  it('should logout when the user confirms', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const logoutSpy = vi.spyOn(auth, 'logout');
    component.logout();
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should not logout when the user cancels', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const logoutSpy = vi.spyOn(auth, 'logout');
    component.logout();
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('should toggle the collapsed state', () => {
    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(false);
  });
});
