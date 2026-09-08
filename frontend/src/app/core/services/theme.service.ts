import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(this.load());

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    this.dark.set(!this.dark());
    this.apply(this.dark());
    localStorage.setItem('taskflow-dark', JSON.stringify(this.dark()));
  }

  private load(): boolean {
    try {
      const stored = localStorage.getItem('taskflow-dark');
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }
}
