import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project, ProjectMember, ProjectRequest } from '../../../core/models/project.model';

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private projects = inject(ProjectService);
  private toast = inject(ToastService);
  private router = inject(Router);

  projectsList = signal<Project[]>([]);
  loading = signal(false);

  searchTerm = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'>('ALL');
  sortBy = signal<'recent' | 'name'>('recent');

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);
  formName = '';
  formDescription = '';

  showInviteModal = signal(false);
  inviteTarget = signal<Project | null>(null);
  inviteEmail = '';
  inviteSubmitting = signal(false);
  members = signal<ProjectMember[]>([]);

  statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo',
    ARCHIVED: 'Arquivado',
    DELETED: 'Excluído',
  };

  filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filtered = this.projectsList().filter((p) => {
      const matchesStatus = this.statusFilter() === 'ALL' || p.status === this.statusFilter();
      const matchesTerm = p.name.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });

    if (this.sortBy() === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  });

  totalProjects = computed(() => this.projectsList().length);
  activeProjects = computed(
    () => this.projectsList().filter((p) => p.status === 'ACTIVE').length,
  );
  archivedProjects = computed(
    () => this.projectsList().filter((p) => p.status === 'ARCHIVED').length,
  );

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projects.getAll().subscribe({
      next: (list) => this.projectsList.set(list),
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao carregar projetos.');
      },
      complete: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.submitting.set(false);
    this.formName = '';
    this.formDescription = '';
    this.showModal.set(true);
  }

  openEdit(p: Project): void {
    this.isEditing.set(true);
    this.editingId.set(p.id);
    this.submitting.set(false);
    this.formName = p.name;
    this.formDescription = p.description || '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    if (this.submitting()) return;
    if (!this.formName.trim()) {
      this.toast.error('O nome do projeto é obrigatório.');
      return;
    }

    const payload: ProjectRequest = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || undefined,
    };

    this.submitting.set(true);

    const handleError = (err: unknown) => {
      this.submitting.set(false);
      this.toast.error(
        (err as { error?: { message?: string } })?.error?.message || 'Erro ao salvar projeto.',
      );
    };

    if (this.isEditing()) {
      const id = this.editingId();
      if (id === null) {
        this.submitting.set(false);
        return;
      }
      this.projects.update(id, payload).subscribe({
        next: (updated) => {
          this.projectsList.update((list) =>
            list.map((p) => (p.id === updated.id ? updated : p)),
          );
          this.submitting.set(false);
          this.toast.success('Projeto atualizado com sucesso!');
          this.closeModal();
        },
        error: handleError,
      });
    } else {
      this.projects.create(payload).subscribe({
        next: (created) => {
          this.projectsList.update((list) => [created, ...list]);
          this.submitting.set(false);
          this.toast.success('Projeto criado com sucesso!');
          this.closeModal();
        },
        error: handleError,
      });
    }
  }

  onDelete(p: Project): void {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${p.name}"?`)) return;
    this.projects.delete(p.id).subscribe({
      next: () => {
        this.projectsList.update((list) => list.filter((x) => x.id !== p.id));
        this.toast.success('Projeto excluído.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Erro ao excluir.'),
    });
  }

  onArchive(p: Project): void {
    this.projects.archive(p.id).subscribe({
      next: (updated) => this.updateProjectInList(updated, 'Projeto arquivado.'),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao arquivar.'),
    });
  }

  onRestore(p: Project): void {
    this.projects.restore(p.id).subscribe({
      next: (updated) => this.updateProjectInList(updated, 'Projeto restaurado.'),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao restaurar.'),
    });
  }

  private updateProjectInList(updated: Project, successMsg: string): void {
    this.projectsList.update((list) =>
      list.map((x) => (x.id === updated.id ? updated : x)),
    );
    this.toast.success(successMsg);
  }

  openInviteModal(p: Project): void {
    this.inviteTarget.set(p);
    this.inviteEmail = '';
    this.inviteSubmitting.set(false);
    this.members.set([]);
    this.showInviteModal.set(true);
    this.loadMembers(p.id);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
    this.inviteTarget.set(null);
  }

  loadMembers(projectId: number): void {
    this.projects.getMembers(projectId).subscribe({
      next: (list) => this.members.set(list),
      error: (err) => this.toast.error(err.error?.message || 'Erro ao carregar membros.'),
    });
  }

  submitInvite(): void {
    if (this.inviteSubmitting()) return;
    const target = this.inviteTarget();
    if (!target) return;
    if (!this.inviteEmail.trim()) {
      this.toast.error('Informe o email da pessoa que deseja convidar.');
      return;
    }

    this.inviteSubmitting.set(true);

    this.projects.inviteMember(target.id, this.inviteEmail.trim()).subscribe({
      next: (member) => {
        this.members.update((list) => [...list, member]);
        this.inviteEmail = '';
        this.inviteSubmitting.set(false);
        this.toast.success(`${member.name} foi adicionado ao projeto!`);
      },
      error: (err) => {
        this.inviteSubmitting.set(false);
        this.toast.error(err.error?.message || 'Erro ao convidar usuário.');
      },
    });
  }

  setSortBy(s: 'recent' | 'name'): void {
    this.sortBy.set(s);
  }

  setStatusFilter(f: 'ALL' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'): void {
    this.statusFilter.set(f);
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  openBoard(p: Project): void {
    this.router.navigate(['/projects', p.id]);
  }

  roleLabel(role: string): string {
    return role === 'OWNER' ? 'Proprietário' : 'Membro';
  }
}
