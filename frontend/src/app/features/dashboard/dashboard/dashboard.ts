import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectMember, ProjectRequest } from '../../../core/models/project.model';

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, FormsModule, ConfirmModalComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private projects = inject(ProjectService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private auth = inject(AuthService);

  currentUserId = computed(() => this.auth.currentUser()?.userId ?? null);
  canManageMembers = computed(() => this.inviteTarget()?.createdById === this.currentUserId());

  projectsList = signal<Project[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  page = signal(0);
  hasMore = signal(true);
  private PAGE_SIZE = 12;

  searchTerm = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'>('ALL');
  sortBy = signal<'recent' | 'name'>('recent');

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);
  formName = '';
  formDescription = '';
  formMembers: string[] = [];
  newMemberEmail = '';

  showInviteModal = signal(false);
  inviteTarget = signal<Project | null>(null);
  inviteEmail = '';
  inviteSubmitting = signal(false);
  members = signal<ProjectMember[]>([]);

  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmDanger = signal(false);
  confirmAction = signal<(() => void) | null>(null);

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
  activeProjects = computed(() => this.projectsList().filter((p) => p.status === 'ACTIVE').length);
  archivedProjects = computed(
    () => this.projectsList().filter((p) => p.status === 'ARCHIVED').length,
  );

  ngOnInit(): void {
    this.loadProjects();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      this.loadMore();
    }
  }

  loadProjects(): void {
    this.loading.set(true);
    this.page.set(0);
    this.hasMore.set(true);
    this.projects.getAllPaged(0, this.PAGE_SIZE).subscribe({
      next: (page) => {
        this.projectsList.set(page.content);
        this.hasMore.set(!page.last);
        this.page.set(0);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao carregar projetos.');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    this.projects.getAllPaged(nextPage, this.PAGE_SIZE).subscribe({
      next: (page) => {
        this.projectsList.update((list) => [...list, ...page.content]);
        this.hasMore.set(!page.last);
        this.page.set(nextPage);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.submitting.set(false);
    this.formName = '';
    this.formDescription = '';
    this.formMembers = [];
    this.newMemberEmail = '';
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

  addFormMember(): void {
    const email = this.newMemberEmail.trim().toLowerCase();
    if (!email) return;
    if (this.formMembers.includes(email)) {
      this.toast.error('Email ja adicionado.');
      return;
    }
    this.formMembers.push(email);
    this.newMemberEmail = '';
  }

  removeFormMember(index: number): void {
    this.formMembers.splice(index, 1);
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
          this.projectsList.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
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
          if (this.formMembers.length > 0) {
            this.inviteMembersAfterCreate(created);
          } else {
            this.submitting.set(false);
            this.toast.success('Projeto criado com sucesso!');
            this.closeModal();
          }
        },
        error: handleError,
      });
    }
  }

  private inviteMembersAfterCreate(project: Project): void {
    let pending = this.formMembers.length;
    const errors: string[] = [];
    for (const email of this.formMembers) {
      this.projects.inviteMember(project.id, email).subscribe({
        next: () => {
          pending--;
          if (pending === 0) this.finishCreate(project, errors);
        },
        error: (err) => {
          errors.push(err.error?.message || email);
          pending--;
          if (pending === 0) this.finishCreate(project, errors);
        },
      });
    }
  }

  private finishCreate(project: Project, errors: string[]): void {
    this.submitting.set(false);
    const invited = this.formMembers.length - errors.length;
    let msg = 'Projeto criado com sucesso!';
    if (invited > 0) msg += ` ${invited} membro(s) convidado(s).`;
    if (errors.length > 0) msg += ` Erros: ${errors.join(', ')}.`;
    this.toast.success(msg);
    this.closeModal();
  }

  onDelete(p: Project): void {
    this.confirmTitle.set('Excluir projeto');
    this.confirmMessage.set(`Tem certeza que deseja excluir o projeto "${p.name}"?`);
    this.confirmDanger.set(true);
    this.confirmAction.set(() => {
      this.projects.delete(p.id).subscribe({
        next: () => {
          this.projectsList.update((list) => list.filter((x) => x.id !== p.id));
          this.toast.success('Projeto excluido.');
        },
        error: (err) => this.toast.error(err.error?.message || 'Erro ao excluir.'),
      });
    });
    this.confirmOpen.set(true);
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
    this.projectsList.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
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

  onRemoveMember(m: ProjectMember): void {
    const target = this.inviteTarget();
    if (!target) return;
    if (m.projectRole === 'OWNER') return;

    const isSelf = m.userId === this.currentUserId();
    if (!isSelf && !this.canManageMembers()) return;

    const action = isSelf ? 'Sair do projeto' : 'Remover do projeto';
    this.confirmTitle.set(action);
    this.confirmMessage.set(`${action} "${m.name}"?`);
    this.confirmDanger.set(!isSelf);
    this.confirmAction.set(() => {
      this.projects.removeMember(target.id, m.userId).subscribe({
        next: () => {
          this.members.update((list) => list.filter((x) => x.userId !== m.userId));
          this.toast.success(
            isSelf ? 'Voce saiu do projeto.' : `${m.name} foi removido do projeto.`,
          );
          if (isSelf) {
            this.closeInviteModal();
            this.loadProjects();
          }
        },
        error: (err) => this.toast.error(err.error?.message || 'Erro ao remover membro.'),
      });
    });
    this.confirmOpen.set(true);
  }

  setSortBy(s: 'recent' | 'name'): void {
    this.sortBy.set(s);
  }

  setStatusFilter(f: 'ALL' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'): void {
    this.statusFilter.set(f);
  }

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  openBoard(p: Project): void {
    this.router.navigate(['/projects', p.id]);
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

  roleLabel(role: string): string {
    return role === 'OWNER' ? 'Proprietário' : 'Membro';
  }
}
