import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TitleCasePipe, ConfirmModalComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.currentUser;
  collapsed = signal(false);

  confirmOpen = signal(false);

  toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }

  logout(): void {
    this.confirmOpen.set(true);
  }

  confirmLogout(): void {
    this.confirmOpen.set(false);
    this.auth.logout();
  }

  cancelLogout(): void {
    this.confirmOpen.set(false);
  }

  get isAdmin(): boolean {
    return this.user()?.role === 'ADMIN';
  }
}
