import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';
import { ProfileModalComponent } from '../../../features/profile/profile-modal';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    TitleCasePipe,
    DatePipe,
    ConfirmModalComponent,
    ProfileModalComponent,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  notificationApi = inject(NotificationService);
  private ws = inject(WebSocketService);
  theme = inject(ThemeService);

  user = this.auth.currentUser;
  collapsed = signal(false);

  confirmOpen = signal(false);
  profileOpen = signal(false);
  showNotifications = signal(false);
  notifications = signal<Notification[]>([]);
  notificationsLoading = signal(false);

  ngOnInit(): void {
    this.ws.connect();
    this.notificationApi.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }

  toggleNotifications(): void {
    const next = !this.showNotifications();
    this.showNotifications.set(next);
    if (next) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.notificationApi.getNotifications(0, 15).subscribe({
      next: (page) => {
        this.notifications.set(page.content);
        this.notificationsLoading.set(false);
      },
      error: () => {
        this.notificationsLoading.set(false);
      },
    });
  }

  markAllRead(): void {
    this.notificationApi.markAllAsRead().subscribe({
      next: () => {
        this.notificationApi.unreadCount.set(0);
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      },
    });
  }

  onNotificationClick(n: Notification): void {
    if (!n.read) {
      this.notificationApi.markAsRead(n.id).subscribe({
        next: () => {
          this.notificationApi.unreadCount.update((c) => Math.max(0, c - 1));
          this.notifications.update((list) =>
            list.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
          );
        },
      });
    }
    this.showNotifications.set(false);
    if (n.referenceType === 'TASK' && n.referenceId) {
      this.router.navigate(['/board', n.referenceId]);
    } else if (n.referenceType === 'PROJECT' && n.referenceId) {
      this.router.navigate(['/board', n.referenceId]);
    }
  }

  logout(): void {
    this.confirmOpen.set(true);
  }

  confirmLogout(): void {
    this.confirmOpen.set(false);
    this.ws.disconnect();
    this.auth.logout();
  }

  cancelLogout(): void {
    this.confirmOpen.set(false);
  }

  get isAdmin(): boolean {
    return this.user()?.role === 'ADMIN';
  }
}
