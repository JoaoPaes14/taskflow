import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { LabelService, TaskLabelRequest } from '../../../core/services/label.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project, ProjectActivity, ProjectMember } from '../../../core/models/project.model';
import {
  ProjectTask,
  TaskComment,
  TaskLabel,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'A fazer' },
  { key: 'IN_PROGRESS', label: 'Em progresso' },
  { key: 'DONE', label: 'Concluido' },
];

@Component({
  selector: 'app-board',
  imports: [SidebarComponent, FormsModule, DatePipe, ConfirmModalComponent],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projects = inject(ProjectService);
  private tasks = inject(TaskService);
  private labels = inject(LabelService);
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
  formLabelIds: number[] = [];

  comments = signal<TaskComment[]>([]);
  commentsLoading = signal(false);
  commentSubmitting = signal(false);
  commentText = '';

  activities = signal<ProjectActivity[]>([]);
  showActivity = signal(false);
  activitiesLoading = signal(false);

  projectLabels = signal<TaskLabel[]>([]);
  showLabelsModal = signal(false);
  newLabelName = '';
  newLabelColor = '#6366f1';
  labelSubmitting = signal(false);

  filterLabelIds = signal<number[]>([]);
  showLabelFilter = signal(false);

  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmDanger = signal(false);
  confirmAction = signal<(() => void) | null>(null);

  columns = COLUMNS;

  draggingId: number | null = null;
  dragOverColumn = signal<TaskStatus | null>(null);

  board = computed(() => {
    const byStatus = new Map<TaskStatus, ProjectTask[]>();
    for (const c of COLUMNS) byStatus.set(c.key, []);
    const activeFilter = this.filterLabelIds();
    for (const t of this.tasksList()) {
      if (activeFilter.length > 0) {
        const taskLabelIds = (t.labels ?? []).map((l) => l.id);
        const hasAll = activeFilter.every((id) => taskLabelIds.includes(id));
        if (!hasAll) continue;
      }
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
    let completed = 0;
    const total = 4;
    const checkDone = () => {
      completed++;
      if (completed >= total) this.loading.set(false);
    };
    this.projects.getById(projectId).subscribe({
      next: (p) => this.project.set(p),
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao carregar projeto.');
        checkDone();
      },
      complete: () => checkDone(),
    });
    this.projects.getMembers(projectId).subscribe({
      next: (m) => this.members.set(m),
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao carregar membros.');
        checkDone();
      },
      complete: () => checkDone(),
    });
    this.tasks.getTasks(projectId).subscribe({
      next: (list) => this.tasksList.set(list),
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao carregar tarefas.');
        checkDone();
      },
      complete: () => checkDone(),
    });
    this.labels.getLabels(projectId).subscribe({
      next: (list) => this.projectLabels.set(list),
      error: () => checkDone(),
      complete: () => checkDone(),
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
    this.formLabelIds = [];
    this.pendingStatus = status;
    this.comments.set([]);
    this.commentText = '';
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
    this.formLabelIds = (task.labels ?? []).map((l) => l.id);
    this.pendingStatus = task.status;
    this.showModal.set(true);
    this.loadComments(task.id);
  }

  loadComments(taskId: number): void {
    this.commentsLoading.set(true);
    this.comments.set([]);
    this.commentText = '';
    this.tasks.getComments(taskId).subscribe({
      next: (list) => {
        this.comments.set(list);
        this.commentsLoading.set(false);
      },
      error: (err) => {
        this.commentsLoading.set(false);
        this.toast.error(err.error?.message || 'Erro ao carregar comentarios.');
      },
    });
  }

  submitComment(): void {
    if (this.commentSubmitting()) return;
    const taskId = this.editingId();
    if (taskId === null) return;
    if (!this.commentText.trim()) {
      this.toast.error('Escreva um comentario antes de enviar.');
      return;
    }
    this.commentSubmitting.set(true);
    this.tasks.addComment(taskId, { content: this.commentText.trim() }).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, comment]);
        this.commentText = '';
        this.commentSubmitting.set(false);
      },
      error: (err) => {
        this.commentSubmitting.set(false);
        this.toast.error(err.error?.message || 'Erro ao enviar comentario.');
      },
    });
  }

  toggleActivity(): void {
    const project = this.project();
    if (!project) return;
    if (this.showActivity()) {
      this.showActivity.set(false);
      return;
    }
    this.activitiesLoading.set(true);
    this.projects.getActivities(project.id).subscribe({
      next: (list) => {
        this.activities.set(list);
        this.activitiesLoading.set(false);
        this.showActivity.set(true);
      },
      error: (err) => {
        this.activitiesLoading.set(false);
        this.toast.error(err.error?.message || 'Erro ao carregar atividades.');
      },
    });
  }

  closeActivity(): void {
    this.showActivity.set(false);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.comments.set([]);
    this.commentText = '';
    this.editingId.set(null);
  }

  submit(): void {
    if (this.submitting()) return;
    if (!this.formTitle.trim()) {
      this.toast.error('O titulo da tarefa e obrigatorio.');
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
      labelIds: this.formLabelIds.length > 0 ? this.formLabelIds : undefined,
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
    this.confirmTitle.set('Excluir tarefa');
    this.confirmMessage.set(`Excluir a tarefa "${task.title}"?`);
    this.confirmDanger.set(true);
    this.confirmAction.set(() => {
      this.tasks.deleteTask(task.id).subscribe({
        next: () => {
          this.tasksList.update((list) => list.filter((t) => t.id !== task.id));
          this.toast.success('Tarefa excluida.');
        },
        error: (err) => this.toast.error(err.error?.message || 'Erro ao excluir.'),
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

  // --- Labels ---
  openLabelsModal(): void {
    this.newLabelName = '';
    this.newLabelColor = '#6366f1';
    this.labelSubmitting.set(false);
    this.showLabelsModal.set(true);
  }

  closeLabelsModal(): void {
    this.showLabelsModal.set(false);
  }

  createLabel(): void {
    if (this.labelSubmitting()) return;
    const project = this.project();
    if (!project) return;
    if (!this.newLabelName.trim()) {
      this.toast.error('Nome da label e obrigatorio.');
      return;
    }
    this.labelSubmitting.set(true);
    this.labels.createLabel(project.id, {
      name: this.newLabelName.trim(),
      color: this.newLabelColor,
    }).subscribe({
      next: (created) => {
        this.projectLabels.update((list) => [...list, created]);
        this.newLabelName = '';
        this.labelSubmitting.set(false);
        this.toast.success('Label criada!');
      },
      error: (err) => {
        this.labelSubmitting.set(false);
        this.toast.error(err.error?.message || 'Erro ao criar label.');
      },
    });
  }

  deleteLabel(label: TaskLabel): void {
    const project = this.project();
    if (!project) return;
    this.labels.deleteLabel(project.id, label.id).subscribe({
      next: () => {
        this.projectLabels.update((list) => list.filter((l) => l.id !== label.id));
        this.filterLabelIds.update((ids) => ids.filter((id) => id !== label.id));
        this.toast.success('Label removida.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Erro ao remover label.'),
    });
  }

  toggleLabelFilter(labelId: number): void {
    this.filterLabelIds.update((ids) =>
      ids.includes(labelId) ? ids.filter((id) => id !== labelId) : [...ids, labelId],
    );
  }

  isLabelFiltered(labelId: number): boolean {
    return this.filterLabelIds().includes(labelId);
  }

  toggleLabelSelection(labelId: number): void {
    this.formLabelIds = this.formLabelIds.includes(labelId)
      ? this.formLabelIds.filter((id) => id !== labelId)
      : [...this.formLabelIds, labelId];
  }

  isLabelSelected(labelId: number): boolean {
    return this.formLabelIds.includes(labelId);
  }

  routerBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onDragStart(event: DragEvent, task: ProjectTask): void {
    this.draggingId = task.id;
    event.dataTransfer?.setData('text/plain', String(task.id));
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverColumn.set(status);
  }

  onDragLeave(status: TaskStatus): void {
    if (this.dragOverColumn() === status) {
      this.dragOverColumn.set(null);
    }
  }

  onDrop(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    this.dragOverColumn.set(null);
    if (this.draggingId !== null) {
      const task = this.tasksList().find((t) => t.id === this.draggingId);
      if (task && task.status !== status) {
        this.changeStatus(task, status);
      }
    }
    this.draggingId = null;
  }

  onDragEnd(): void {
    this.draggingId = null;
    this.dragOverColumn.set(null);
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  priorityLabel(p: TaskPriority): string {
    return { LOW: 'Baixa', MEDIUM: 'Media', HIGH: 'Alta' }[p] || p;
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
}
