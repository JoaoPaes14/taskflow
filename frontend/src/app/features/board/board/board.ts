import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project, ProjectMember } from '../../../core/models/project.model';
import { ProjectTask, TaskPriority, TaskStatus } from '../../../core/models/task.model';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'A fazer' },
  { key: 'IN_PROGRESS', label: 'Em progresso' },
  { key: 'DONE', label: 'Concluído' },
];

@Component({
  selector: 'app-board',
  imports: [SidebarComponent, FormsModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projects = inject(ProjectService);
  private tasks = inject(TaskService);
  private toast = inject(ToastService);

  project = signal<Project | null>(null);
  members = signal<ProjectMember[]>([]);
  tasksList = signal<ProjectTask[]>([]);
  loading = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);

  formTitle = '';
  formDescription = '';
  formPriority: TaskPriority = 'MEDIUM';
  formDueDate = '';
  formAssigneeId: number | null = null;

  columns = COLUMNS;

  board = computed(() => {
    const byStatus = new Map<TaskStatus, ProjectTask[]>();
    for (const c of COLUMNS) byStatus.set(c.key, []);
    for (const t of this.tasksList()) {
      const list = byStatus.get(t.status);
      if (list) list.push(t);
    }
    for (const c of COLUMNS) {
      byStatus.get(c.key)!.sort((a, b) => a.position - b.position);
    }
    return byStatus;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadAll(id);
  }

  private loadAll(projectId: number): void {
    this.loading.set(true);
    this.projects.getById(projectId).subscribe({
      next: (p) => this.project.set(p),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao carregar projeto.'),
    });
    this.projects.getMembers(projectId).subscribe({
      next: (m) => this.members.set(m),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao carregar membros.'),
    });
    this.tasks.getTasks(projectId).subscribe({
      next: (list) => this.tasksList.set(list),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao carregar tarefas.'),
      complete: () => this.loading.set(false),
    });
  }

  getTasks(status: TaskStatus): ProjectTask[] {
    return this.board().get(status) ?? [];
  }

  openCreate(status: TaskStatus): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.submitting.set(false);
    this.formTitle = '';
    this.formDescription = '';
    this.formPriority = 'MEDIUM';
    this.formDueDate = '';
    this.formAssigneeId = null;
    this.pendingStatus = status;
    this.showModal.set(true);
  }

  openEdit(task: ProjectTask): void {
    this.isEditing.set(true);
    this.editingId.set(task.id);
    this.submitting.set(false);
    this.formTitle = task.title;
    this.formDescription = task.description || '';
    this.formPriority = task.priority;
    this.formDueDate = task.dueDate || '';
    this.formAssigneeId = task.assigneeId ?? null;
    this.pendingStatus = task.status;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    if (this.submitting()) return;
    if (!this.formTitle.trim()) {
      this.toast.error('O título da tarefa é obrigatório.');
      return;
    }
    const project = this.project();
    if (!project) return;

    const payload = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim() || undefined,
      priority: this.formPriority,
      status: this.pendingStatus,
      dueDate: this.formDueDate || undefined,
      assigneeId: this.formAssigneeId ?? undefined,
    };

    this.submitting.set(true);

    if (this.isEditing()) {
      const id = this.editingId();
      if (id === null) {
        this.submitting.set(false);
        return;
      }
      this.tasks.updateTask(id, payload).subscribe({
        next: (updated) => {
          this.tasksList.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
          this.submitting.set(false);
          this.toast.success('Tarefa atualizada!');
          this.closeModal();
        },
        error: (err) => this.handleError(err),
      });
    } else {
      this.tasks.createTask(project.id, payload).subscribe({
        next: (created) => {
          this.tasksList.update((list) => [...list, created]);
          this.submitting.set(false);
          this.toast.success('Tarefa criada!');
          this.closeModal();
        },
        error: (err) => this.handleError(err),
      });
    }
  }

  changeStatus(task: ProjectTask, newStatus: TaskStatus): void {
    if (task.status === newStatus) return;
    const target = this.getTasks(newStatus).length;
    this.tasks.updateTaskStatus(task.id, { status: newStatus, position: target }).subscribe({
      next: (updated) => {
        this.tasksList.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      },
      error: (err) => this.toast.error(err.error?.message || 'Erro ao mover tarefa.'),
    });
  }

  onDelete(task: ProjectTask): void {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    this.tasks.deleteTask(task.id).subscribe({
      next: () => {
        this.tasksList.update((list) => list.filter((t) => t.id !== task.id));
        this.toast.success('Tarefa excluída.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Erro ao excluir.'),
    });
  }

  routerBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onDragStart(event: DragEvent, task: ProjectTask): void {
    this.draggingId = task.id;
    event.dataTransfer?.setData('text/plain', String(task.id));
  }

  onDrop(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    if (this.draggingId !== null) {
      const task = this.tasksList().find((t) => t.id === this.draggingId);
      if (task && task.status !== status) {
        this.changeStatus(task, status);
      }
    }
    this.draggingId = null;
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  priorityLabel(p: TaskPriority): string {
    return { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' }[p] || p;
  }

  assigneeName(userId: number | undefined): string {
    if (!userId) return '';
    return this.members().find((m) => m.userId === userId)?.name || '';
  }

  isOverdue(task: ProjectTask): boolean {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  }

  private handleError(err: unknown): void {
    this.submitting.set(false);
    this.toast.error(
      (err as { error?: { message?: string } })?.error?.message || 'Erro ao salvar tarefa.',
    );
  }

  private pendingStatus: TaskStatus = 'TODO';
  private draggingId: number | null = null;
}
