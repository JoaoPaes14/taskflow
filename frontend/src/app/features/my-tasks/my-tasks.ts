import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { ProjectTask } from '../../core/models/task.model';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [SidebarComponent, DatePipe],
  templateUrl: './my-tasks.html',
  styles: [
    `
      :host {
        display: flex;
        height: 100vh;
        background: var(--bg);
        color: var(--text);
      }
      .main {
        flex: 1;
        padding: 1.5rem 2rem;
        overflow-y: auto;
      }
      h1 {
        font-size: 1.4rem;
        margin-bottom: 1.25rem;
      }
      .stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .stat-card {
        padding: 0.75rem 1rem;
        border-radius: var(--radius-sm);
        background: var(--surface);
        border: 1px solid var(--border);
        font-size: 0.82rem;
        flex: 1;
        strong {
          display: block;
          font-size: 1.4rem;
          margin-bottom: 0.2rem;
        }
      }
      .filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .filter-btn {
        padding: 0.4rem 0.85rem;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        &.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        &:hover {
          border-color: var(--primary);
        }
      }
      .task-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .task-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
        animation: fadeInUp 0.3s ease both;
        &:hover {
          box-shadow: var(--shadow-md);
          border-color: rgba(99, 102, 241, 0.2);
        }
      }
      .status-badge {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        &.todo {
          background: #f59e0b;
        }
        &.in-progress {
          background: #8b5cf6;
        }
        &.done {
          background: #10b981;
        }
      }
      .task-info {
        flex: 1;
        min-width: 0;
      }
      .task-title {
        font-size: 0.88rem;
        font-weight: 600;
      }
      .task-project {
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-top: 0.15rem;
      }
      .task-due {
        font-size: 0.72rem;
        padding: 0.2rem 0.5rem;
        border-radius: 8px;
        &.overdue {
          background: var(--danger-soft);
          color: var(--danger);
        }
        &.today {
          background: #fef3c7;
          color: #92400e;
        }
        &.future {
          background: var(--bg);
          color: var(--text-muted);
        }
      }
      .priority-badge {
        font-size: 0.68rem;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        font-weight: 600;
        &.high {
          background: #fee2e2;
          color: #dc2626;
        }
        &.medium {
          background: #fef3c7;
          color: #d97706;
        }
        &.low {
          background: #dbeafe;
          color: #2563eb;
        }
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-muted);
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
export class MyTasksComponent implements OnInit {
  private tasks = inject(TaskService);
  private toast = inject(ToastService);
  private router = inject(Router);

  allTasks = signal<ProjectTask[]>([]);
  loading = signal(false);
  filterStatus = signal<string>('ALL');

  filteredTasks = signal<ProjectTask[]>([]);

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.tasks.getMyTasks().subscribe({
      next: (list) => {
        this.allTasks.set(list);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar tarefas.');
        this.loading.set(false);
      },
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const status = this.filterStatus();
    const all = this.allTasks();
    if (status === 'ALL') {
      this.filteredTasks.set(all);
    } else {
      this.filteredTasks.set(all.filter((t) => t.status === status));
    }
  }

  count(status: string): number {
    if (status === 'ALL') return this.allTasks().length;
    return this.allTasks().filter((t) => t.status === status).length;
  }

  goToBoard(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }

  isOverdue(task: ProjectTask): boolean {
    return !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  }

  isToday(task: ProjectTask): boolean {
    if (!task.dueDate) return false;
    const d = new Date(task.dueDate);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  getDueClass(task: ProjectTask): string {
    if (!task.dueDate) return '';
    if (task.status === 'DONE') return '';
    if (this.isOverdue(task)) return 'overdue';
    if (this.isToday(task)) return 'today';
    return 'future';
  }
}
