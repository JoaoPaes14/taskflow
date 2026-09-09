import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { AdminService, UserRole } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-admin',
  imports: [SidebarComponent, FormsModule, ConfirmModalComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private router = inject(Router);

  users = signal<AuthResponse[]>([]);
  loading = signal(false);

  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmAction = signal<(() => void) | null>(null);

  roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    MEMBER: 'Membro',
  };

  roleColors: Record<string, string> = {
    ADMIN: '#ef4444',
    MANAGER: '#f59e0b',
    MEMBER: '#6366f1',
  };

  ngOnInit(): void {
    const currentUser = this.auth.currentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Erro ao carregar usuarios.');
      },
    });
  }

  changeRole(user: AuthResponse, newRole: UserRole): void {
    if (user.role === newRole) return;
    this.confirmTitle.set('Alterar permissao');
    this.confirmMessage.set(`Alterar a role de ${user.name} para ${this.roleLabels[newRole]}?`);
    this.confirmAction.set(() => {
      this.admin.updateUserRole(user.userId, newRole).subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.userId === updated.userId ? updated : u)));
          this.toast.success(`Role de ${user.name} alterada para ${this.roleLabels[newRole]}.`);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Erro ao alterar role.');
        },
      });
    });
    this.confirmOpen.set(true);
  }

  confirmClose(): void {
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
  }

  confirmConfirm(): void {
    const action = this.confirmAction();
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    if (action) action();
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  isCurrentUser(userId: number): boolean {
    return this.auth.currentUser()?.userId === userId;
  }
}
