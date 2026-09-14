import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subtask } from '../../../core/services/subtask.service';

@Component({
  selector: 'app-subtask-list',
  imports: [FormsModule],
  template: `
    <div class="subtasks-section">
      <h3 class="section-title">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        Subtarefas ({{ completedCount() }}/{{ subtasks().length }})
      </h3>
      @if (subtasks().length > 0) {
        <div class="subtask-progress-bar">
          <div class="subtask-progress-fill" [style.width.%]="progress()"></div>
        </div>
      }
      @if (loading()) {
        <p class="section-empty">Carregando...</p>
      } @else {
        <div class="subtasks-list">
          @for (sub of subtasks(); track sub.id) {
            <div class="subtask-item" [class.completed]="sub.completed">
              <button type="button" class="subtask-check" (click)="toggle.emit(sub)">
                @if (sub.completed) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              </button>
              <span class="subtask-title">{{ sub.title }}</span>
              <button type="button" class="subtask-delete" (click)="deleteSubtask.emit(sub)">
                <svg
                  width="13"
                  height="13"
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
            </div>
          }
        </div>
        <form (ngSubmit)="onAdd()" class="subtask-form">
          <input
            type="text"
            [(ngModel)]="newTitle"
            name="newSubtask"
            placeholder="Nova subtarefa..."
            class="subtask-input"
          />
          <button
            type="submit"
            class="btn-primary btn-xs"
            [disabled]="!newTitle.trim() || submitting()"
          >
            {{ submitting() ? '...' : 'Adicionar' }}
          </button>
        </form>
      }
    </div>
  `,
  styles: [
    `
      .subtasks-section {
        margin-top: 1.25rem;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
      }
      .section-title {
        font-size: 0.85rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .section-empty {
        color: var(--text-muted);
        font-size: 0.82rem;
        margin: 0.5rem 0;
      }
      .subtask-progress-bar {
        width: 100%;
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        margin-bottom: 0.75rem;
        overflow: hidden;
      }
      .subtask-progress-fill {
        height: 100%;
        background: var(--success);
        border-radius: 2px;
        transition: width 0.3s;
      }
      .subtasks-list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 0.5rem;
      }
      .subtask-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        transition: all 0.15s;
      }
      .subtask-item:hover {
        background: var(--bg);
      }
      .subtask-item.completed .subtask-title {
        text-decoration: line-through;
        color: var(--text-muted);
      }
      .subtask-check {
        width: 22px;
        height: 22px;
        border: 2px solid var(--border);
        border-radius: 6px;
        background: var(--surface);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s;
        color: var(--success);
      }
      .subtask-check:hover {
        border-color: var(--success);
      }
      .subtask-item.completed .subtask-check {
        background: var(--success);
        border-color: var(--success);
        color: white;
      }
      .subtask-title {
        flex: 1;
        font-size: 0.82rem;
        font-weight: 500;
      }
      .subtask-delete {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 6px;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.15s;
      }
      .subtask-delete:hover {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .subtask-item:hover .subtask-delete {
        opacity: 1;
      }
      .subtask-form {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .subtask-input {
        flex: 1;
        padding: 0.5rem 0.7rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.82rem;
      }
      .subtask-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
      .btn-primary {
        padding: 0.4rem 0.75rem;
        border: none;
        border-radius: 6px;
        background: var(--primary);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-xs {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
      }
    `,
  ],
})
export class SubtaskListComponent {
  subtasks = input.required<Subtask[]>();
  loading = input(false);
  submitting = input(false);

  toggle = output<Subtask>();
  deleteSubtask = output<Subtask>();
  add = output<string>();

  newTitle = '';

  completedCount(): number {
    return this.subtasks().filter((s) => s.completed).length;
  }

  progress(): number {
    const list = this.subtasks();
    if (list.length === 0) return 0;
    return Math.round((list.filter((s) => s.completed).length / list.length) * 100);
  }

  onAdd(): void {
    if (!this.newTitle.trim()) return;
    this.add.emit(this.newTitle.trim());
    this.newTitle = '';
  }
}
