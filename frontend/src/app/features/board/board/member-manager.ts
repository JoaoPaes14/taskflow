import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project, ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-member-manager',
  imports: [FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal members-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Membros do projeto</h2>
          <button class="modal-close" (click)="closed.emit()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="invite-row">
            <input
              type="email"
              placeholder="Email do membro"
              [(ngModel)]="inviteEmail"
              (keyup.enter)="onInvite()"
            />
            <button
              class="btn-primary"
              [disabled]="inviteSubmitting() || !inviteEmail.trim()"
              (click)="onInvite()"
            >
              {{ inviteSubmitting() ? '...' : 'Convidar' }}
            </button>
          </div>
          <div class="members-list">
            @for (m of members(); track m.userId) {
              <div class="member-item">
                <span class="member-avatar">{{ getInitial(m.name) }}</span>
                <div class="member-info">
                  <span class="member-name">{{ m.name }}</span>
                  <span class="member-role">{{ m.role }}</span>
                </div>
                @if (m.userId !== project()?.createdById) {
                  <button class="btn-remove" (click)="removeMember.emit(m.userId)" title="Remover">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                }
              </div>
            } @empty {
              <p class="empty-text">Nenhum membro encontrado.</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: var(--surface);
        border-radius: 14px;
        border: 1px solid var(--border);
        width: 100%;
        max-width: 480px;
        box-shadow: var(--shadow-lg);
        animation: scaleIn 0.2s ease;
      }
      .members-modal {
        max-width: 480px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem 0;
      }
      .modal-header h2 {
        font-size: 1.1rem;
        margin: 0;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-muted);
        line-height: 1;
      }
      .modal-close:hover {
        color: var(--text);
      }
      .modal-body {
        padding: 1.25rem 1.5rem;
      }
      .invite-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .invite-row input {
        flex: 1;
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg);
        color: var(--text);
        font-size: 0.85rem;
        outline: none;
      }
      .invite-row input:focus {
        border-color: var(--primary);
      }
      .btn-primary {
        padding: 0.55rem 1rem;
        border: none;
        border-radius: 10px;
        background: var(--primary);
        color: white;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-primary:hover {
        background: var(--primary-dark);
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .members-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        max-height: 300px;
        overflow-y: auto;
      }
      .member-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0.75rem;
        border-radius: 10px;
        background: var(--bg);
      }
      .member-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .member-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .member-name {
        font-size: 0.85rem;
        font-weight: 600;
      }
      .member-role {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
      .btn-remove {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
      }
      .btn-remove:hover {
        color: var(--danger);
        background: var(--danger-soft);
      }
      .empty-text {
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
        padding: 1.5rem;
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class MemberManagerComponent {
  project = input.required<Project>();
  members = input.required<ProjectMember[]>();
  closed = output<void>();
  invite = output<string>();
  removeMember = output<number>();

  inviteEmail = '';
  inviteSubmitting = signal(false);

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  onInvite(): void {
    if (!this.inviteEmail.trim()) return;
    this.inviteSubmitting.set(true);
    this.invite.emit(this.inviteEmail.trim());
    this.inviteEmail = '';
    setTimeout(() => this.inviteSubmitting.set(false), 1000);
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }
}
