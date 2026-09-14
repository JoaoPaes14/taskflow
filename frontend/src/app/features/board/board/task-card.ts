import { Component, input, output } from '@angular/core';
import { ProjectTask, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-task-card',
  template: `
    <div
      class="task-card"
      [class.done]="task().status === 'DONE'"
      [class.overdue]="isOverdue()"
      [class.dragging]="isDragging()"
      [class.selected]="isSelected()"
      draggable="true"
      (dragstart)="onDragStart.emit({ event: $event, task: task() })"
      (dragend)="onDragEnd.emit()"
    >
      <div class="task-select" (click)="$event.stopPropagation(); toggleSelect.emit(task().id)">
        <div class="checkbox" [class.checked]="isSelected()">
          @if (isSelected()) {
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        </div>
      </div>
      @if (task().labels && task().labels!.length > 0) {
        <div class="task-labels-row">
          @for (label of task().labels!; track label.id) {
            <span
              class="task-label-dot"
              [style.background]="label.color"
              [title]="label.name"
            ></span>
          }
        </div>
      }

      <div class="task-card-top">
        <span class="priority-badge" [class]="task().priority.toLowerCase()">
          {{ priorityLabel(task().priority) }}
        </span>
        @if (isOverdue()) {
          <span class="overdue-badge">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Atrasado
          </span>
        }
      </div>

      <h3 class="task-title">{{ task().title }}</h3>
      @if (task().description) {
        <p class="task-desc">{{ task().description }}</p>
      }

      @if (task().subtasks && task().subtasks!.length > 0) {
        <div class="task-subtasks-mini">
          <svg
            width="12"
            height="12"
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
          {{ task().subtasks!.filter((s) => s.completed).length }}/{{ task().subtasks!.length }}
        </div>
      }

      <div class="task-meta">
        @if (task().assigneeName) {
          <span class="assignee" [title]="task().assigneeName">
            <span class="assignee-avatar">{{ getInitial(task().assigneeName!) }}</span>
            {{ task().assigneeName }}
          </span>
        }
        @if (task().dueDate) {
          <span class="due" [class.overdue]="isOverdue()">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ task().dueDate }}
          </span>
        }
        @if (task().recurrence && task().recurrence !== 'NONE') {
          <span class="recurrence-badge">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {{
              task().recurrence === 'DAILY'
                ? 'Diaria'
                : task().recurrence === 'WEEKLY'
                  ? 'Semanal'
                  : 'Mensal'
            }}
          </span>
        }
      </div>

      <div class="task-actions">
        @if (task().status !== 'TODO') {
          <button
            class="mini-btn"
            title="Mover para A fazer"
            (click)="changeStatus.emit({ task: task(), status: 'TODO' })"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        }
        @if (task().status !== 'IN_PROGRESS') {
          <button
            class="mini-btn"
            title="Em progresso"
            (click)="changeStatus.emit({ task: task(), status: 'IN_PROGRESS' })"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        }
        @if (task().status !== 'DONE') {
          <button
            class="mini-btn success"
            title="Concluir"
            (click)="changeStatus.emit({ task: task(), status: 'DONE' })"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        }
        <span class="mini-separator"></span>
        <button class="mini-btn edit" title="Editar" (click)="edit.emit(task())">
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
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="mini-btn delete" title="Excluir" (click)="delete.emit(task())">
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
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .task-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm, 8px);
        padding: 0.9rem;
        cursor: grab;
        transition: all 0.2s ease;
        animation: fadeInUp 0.3s ease both;
        display: flex;
        gap: 0.5rem;
      }
      .task-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
        border-color: rgba(99, 102, 241, 0.2);
      }
      .task-card.selected {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .task-select {
        flex-shrink: 0;
        padding-top: 2px;
      }
      .checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
      }
      .checkbox:hover {
        border-color: var(--primary);
      }
      .checkbox.checked {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
      .task-card:active {
        cursor: grabbing;
      }
      .task-card.dragging {
        opacity: 0.4;
        transform: rotate(2deg) scale(0.98);
        box-shadow: var(--shadow-lg);
      }
      .task-card.done {
        opacity: 0.6;
      }
      .task-card.done .task-title {
        text-decoration: line-through;
        color: var(--text-muted);
      }
      .task-card.overdue {
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.02);
      }
      .task-labels-row {
        display: flex;
        gap: 0.3rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }
      .task-label-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: transform 0.15s;
      }
      .task-label-dot:hover {
        transform: scale(1.4);
      }
      .task-card-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .priority-badge {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        text-transform: capitalize;
      }
      .priority-badge.low {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
      }
      .priority-badge.medium {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }
      .priority-badge.high {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
      .overdue-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        background: var(--danger-soft);
        color: var(--danger);
      }
      .task-title {
        font-size: 0.88rem;
        font-weight: 600;
        margin: 0 0 0.3rem;
        line-height: 1.35;
      }
      .task-desc {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: 0 0 0.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.45;
      }
      .task-subtasks-mini {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted);
        margin-bottom: 0.4rem;
        padding: 0.15rem 0.4rem;
        background: var(--bg);
        border-radius: 4px;
      }
      .task-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
      }
      .assignee {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.73rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      .assignee-avatar {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .due {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.73rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      .due.overdue {
        color: var(--danger);
        font-weight: 700;
      }
      .recurrence-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.68rem;
        color: #8b5cf6;
        font-weight: 600;
        background: rgba(139, 92, 246, 0.1);
        padding: 0.1rem 0.4rem;
        border-radius: 6px;
      }
      .task-actions {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        flex-wrap: wrap;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border);
      }
      .mini-separator {
        width: 1px;
        height: 16px;
        background: var(--border);
        margin: 0 0.15rem;
      }
      .mini-btn {
        width: 26px;
        height: 26px;
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
      .mini-btn:hover {
        background: var(--bg);
        color: var(--text);
      }
      .mini-btn.edit:hover {
        background: rgba(99, 102, 241, 0.1);
        color: var(--primary);
      }
      .mini-btn.success:hover {
        background: rgba(16, 185, 129, 0.12);
        color: var(--success);
      }
      .mini-btn.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TaskCardComponent {
  task = input.required<ProjectTask>();
  isDragging = input(false);
  isSelected = input(false);
  toggleSelect = output<number>();
  changeStatus = output<{ task: ProjectTask; status: TaskStatus }>();
  edit = output<ProjectTask>();
  delete = output<ProjectTask>();
  onDragStart = output<{ event: DragEvent; task: ProjectTask }>();
  onDragEnd = output<void>();

  isOverdue(): boolean {
    const t = this.task();
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < new Date();
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  priorityLabel(p: TaskPriority): string {
    return { LOW: 'Baixa', MEDIUM: 'Media', HIGH: 'Alta' }[p] || p;
  }
}
