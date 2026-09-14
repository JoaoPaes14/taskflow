import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light when localStorage is empty', () => {
    expect(service.dark()).toBe(false);
    expect(document.documentElement.className).not.toContain('dark');
  });

  it('should load dark theme from localStorage', () => {
    localStorage.setItem('taskflow-dark', 'true');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    const fresh = TestBed.inject(ThemeService);
    expect(fresh.dark()).toBe(true);
    expect(document.documentElement.className).toContain('dark');
  });

  it('should toggle theme and persist to localStorage', () => {
    expect(service.dark()).toBe(false);
    service.toggle();
    expect(service.dark()).toBe(true);
    expect(document.documentElement.className).toContain('dark');
    expect(localStorage.getItem('taskflow-dark')).toBe('true');
    service.toggle();
    expect(service.dark()).toBe(false);
    expect(localStorage.getItem('taskflow-dark')).toBe('false');
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('taskflow-dark', 'not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    const fresh = TestBed.inject(ThemeService);
    expect(fresh.dark()).toBe(false);
  });
});
