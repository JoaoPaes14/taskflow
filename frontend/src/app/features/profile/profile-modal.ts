import { Component, inject, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Meu perfil</h2>
            <button class="modal-close" (click)="close.emit()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="profile-name">Nome</label>
              <input id="profile-name" type="text" [(ngModel)]="name" placeholder="Seu nome" />
            </div>
            <div class="form-group">
              <label for="profile-email">Email</label>
              <input id="profile-email" type="email" [(ngModel)]="email" placeholder="Seu email" />
            </div>
            <div class="form-group">
              <label for="profile-password">Nova senha (opcional)</label>
              <input id="profile-password" type="password" [(ngModel)]="password" placeholder="Deixe em branco para manter" />
            </div>
            <div class="form-group toggle-row">
              <label for="profile-email-notif">Notificacoes por email</label>
              <button
                type="button"
                class="toggle-btn"
                [class.active]="emailNotifications"
                (click)="emailNotifications = !emailNotifications"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="close.emit()">Cancelar</button>
            <button class="btn-primary" [disabled]="submitting()" (click)="save()">
              {{ submitting() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; backdrop-filter: blur(4px);
    }
    .modal {
      background: var(--surface); border-radius: 14px; border: 1px solid var(--border);
      width: 100%; max-width: 420px; box-shadow: var(--shadow-lg);
      animation: scaleIn 0.2s ease;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem 0;
      h2 { font-size: 1.1rem; font-weight: 700; }
    }
    .modal-close {
      background: none; border: none; font-size: 1.5rem; cursor: pointer;
      color: var(--text-muted); line-height: 1;
      &:hover { color: var(--text); }
    }
    .modal-body { padding: 1.25rem 1.5rem; }
    .form-group {
      margin-bottom: 1rem;
      label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted); }
      input {
        width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
        border-radius: 10px; background: var(--bg); color: var(--text);
        font-size: 0.88rem; outline: none; transition: border-color 0.2s;
        &:focus { border-color: var(--primary); }
      }
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      padding: 0 1.5rem 1.25rem;
    }
    .btn-secondary {
      padding: 0.55rem 1rem; border: 1px solid var(--border); border-radius: 10px;
      background: var(--surface); color: var(--text-muted); font-size: 0.82rem;
      font-weight: 600; cursor: pointer;
      &:hover { color: var(--text); border-color: var(--text-muted); }
    }
    .btn-primary {
      padding: 0.55rem 1rem; border: none; border-radius: 10px;
      background: var(--primary); color: white; font-size: 0.82rem;
      font-weight: 600; cursor: pointer;
      &:hover { background: var(--primary-dark); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      label { margin-bottom: 0; }
    }
    .toggle-btn {
      width: 40px; height: 22px; border-radius: 11px; border: none;
      background: var(--border); cursor: pointer; position: relative;
      transition: background 0.2s;
      &.active { background: var(--primary); }
      .toggle-knob {
        width: 18px; height: 18px; border-radius: 50%; background: white;
        position: absolute; top: 2px; left: 2px; transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      &.active .toggle-knob { transform: translateX(18px); }
    }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ProfileModalComponent implements OnInit {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private auth = inject(AuthService);
  private toast = inject(ToastService);

  name = '';
  email = '';
  password = '';
  emailNotifications = true;
  submitting = signal(false);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
  }

  save(): void {
    if (!this.name.trim() || !this.email.trim()) {
      this.toast.error('Nome e email sao obrigatorios.');
      return;
    }
    this.submitting.set(true);
    const data: { name: string; email: string; password?: string; emailNotifications?: boolean } = {
      name: this.name.trim(),
      email: this.email.trim(),
      emailNotifications: this.emailNotifications,
    };
    if (this.password.trim()) {
      data.password = this.password.trim();
    }
    this.auth.updateProfile(data).subscribe({
      next: () => {
        this.toast.success('Perfil atualizado!');
        this.submitting.set(false);
        this.close.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao atualizar perfil.');
        this.submitting.set(false);
      },
    });
  }
}
