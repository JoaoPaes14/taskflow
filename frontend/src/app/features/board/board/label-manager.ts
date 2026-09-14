import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskLabel } from '../../../core/models/task.model';

@Component({
  selector: 'app-label-manager',
  imports: [FormsModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Gerenciar Labels</h2>
          <button class="modal-close" (click)="closed.emit()">&times;</button>
        </div>
        <p class="labels-subtitle">
          Crie e gerencie labels para organizar as tarefas deste projeto.
        </p>

        <form (ngSubmit)="onCreate()" class="label-form">
          <div class="label-form-row">
            <input
              type="text"
              [(ngModel)]="newLabelName"
              name="newLabelName"
              placeholder="Nome da label"
              maxlength="50"
              class="label-input"
            />
            <input
              type="color"
              [(ngModel)]="newLabelColor"
              name="newLabelColor"
              class="label-color-picker"
            />
            <button type="submit" class="btn-primary btn-sm" [disabled]="submitting()">
              {{ submitting() ? '...' : 'Criar' }}
            </button>
          </div>
        </form>

        <div class="labels-list">
          @for (label of labels(); track label.id) {
            <div class="label-item">
              @if (editingId() === label.id) {
                <input type="color" [(ngModel)]="editingColor" class="label-color-input" />
                <input
                  type="text"
                  [(ngModel)]="editingName"
                  class="label-name-input"
                  placeholder="Nome"
                />
                <button class="label-save" (click)="onSaveEdit(label)">Salvar</button>
                <button class="label-cancel" (click)="editingId.set(null)">Cancelar</button>
              } @else {
                <span class="label-dot" [style.background]="label.color"></span>
                <span class="label-name">{{ label.name }}</span>
                <span class="label-hex">{{ label.color }}</span>
                <button class="label-edit" title="Editar label" (click)="onStartEdit(label)">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="label-delete" title="Remover label" (click)="onDelete(label)">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              }
            </div>
          } @empty {
            <p class="section-empty">Nenhuma label criada ainda.</p>
          }
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
        max-width: 420px;
        padding: 1.5rem;
        box-shadow: var(--shadow-lg);
        animation: scaleIn 0.2s ease;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
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
      .labels-subtitle {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin: 0 0 1rem;
      }
      .label-form {
        margin-bottom: 1rem;
      }
      .label-form-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .label-input {
        flex: 1;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 0.85rem;
      }
      .label-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
      .label-color-picker {
        width: 40px;
        height: 38px;
        border: 1px solid var(--border);
        border-radius: 10px;
        cursor: pointer;
        padding: 2px;
        background: var(--surface);
      }
      .labels-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        max-height: 260px;
        overflow-y: auto;
      }
      .label-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0.75rem;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 10px;
        transition: all 0.15s;
      }
      .label-item:hover {
        border-color: var(--primary-light);
      }
      .label-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .label-name {
        font-size: 0.85rem;
        font-weight: 600;
        flex: 1;
      }
      .label-hex {
        font-size: 0.72rem;
        color: var(--text-muted);
        font-family: monospace;
      }
      .label-color-input {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        background: none;
      }
      .label-name-input {
        flex: 1;
        padding: 0.3rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 0.82rem;
        background: var(--surface);
        color: var(--text);
      }
      .label-save,
      .label-cancel {
        padding: 0.3rem 0.6rem;
        border: none;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
      }
      .label-save {
        background: var(--primary);
        color: white;
      }
      .label-cancel {
        background: var(--border);
        color: var(--text-muted);
      }
      .label-edit,
      .label-delete {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .label-edit:hover {
        color: var(--primary);
        background: var(--primary-soft);
      }
      .label-delete:hover {
        color: var(--danger);
        background: var(--danger-soft);
      }
      .section-empty {
        color: var(--text-muted);
        font-size: 0.82rem;
        text-align: center;
        padding: 1rem;
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
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
export class LabelManagerComponent {
  labels = input.required<TaskLabel[]>();
  closed = output<void>();
  createLabel = output<{ name: string; color: string }>();
  updateLabel = output<{ label: TaskLabel; name: string; color: string }>();
  deleteLabel = output<TaskLabel>();

  newLabelName = '';
  newLabelColor = '#6366f1';
  submitting = signal(false);

  editingId = signal<number | null>(null);
  editingName = '';
  editingColor = '#6366f1';

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  onCreate(): void {
    if (this.submitting() || !this.newLabelName.trim()) return;
    this.submitting.set(true);
    this.createLabel.emit({ name: this.newLabelName.trim(), color: this.newLabelColor });
    this.newLabelName = '';
    this.submitting.set(false);
  }

  onStartEdit(label: TaskLabel): void {
    this.editingId.set(label.id);
    this.editingName = label.name;
    this.editingColor = label.color;
  }

  onSaveEdit(label: TaskLabel): void {
    if (!this.editingName.trim()) return;
    this.updateLabel.emit({ label, name: this.editingName.trim(), color: this.editingColor });
    this.editingId.set(null);
  }

  onDelete(label: TaskLabel): void {
    this.deleteLabel.emit(label);
  }
}
