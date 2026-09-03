import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectRequest } from '../../../core/models/project.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private projects = inject(ProjectService);
  private router = inject(Router);

  name = signal(this.auth.currentUser()?.name || '');
  projectsList = signal<Project[]>([]);
  loading = signal(false);
  error = signal('');

  showCreate = signal(false);
  newProjectName = '';
  newProjectDescription = '';

  editingId = signal<number | null>(null);
  editName = '';
  editDescription = '';

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.error.set('');
    this.projects.getAll().subscribe({
      next: (list) => this.projectsList.set(list),
      error: (err) => this.error.set(err.error?.message || 'Failed to load projects'),
      complete: () => this.loading.set(false),
    });
  }

  onCreate(): void {
    const payload: ProjectRequest = {
      name: this.newProjectName,
      description: this.newProjectDescription,
    };
    this.projects.create(payload).subscribe({
      next: (created) => {
        this.projectsList.update((list) => [created, ...list]);
        this.showCreate.set(false);
        this.newProjectName = '';
        this.newProjectDescription = '';
      },
      error: (err) => this.error.set(err.error?.message || 'Failed to create project'),
    });
  }

  startEdit(p: Project): void {
    this.editingId.set(p.id);
    this.editName = p.name;
    this.editDescription = p.description || '';
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  onUpdate(): void {
    const id = this.editingId();
    if (id === null) return;

    const payload: ProjectRequest = {
      name: this.editName,
      description: this.editDescription,
    };
    this.projects.update(id, payload).subscribe({
      next: (updated) => {
        this.projectsList.update((list) =>
          list.map((p) => (p.id === updated.id ? updated : p)),
        );
        this.cancelEdit();
      },
      error: (err) => this.error.set(err.error?.message || 'Failed to update project'),
    });
  }

  onDelete(id: number): void {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    this.projects.delete(id).subscribe({
      next: () =>
        this.projectsList.update((list) => list.filter((p) => p.id !== id)),
      error: (err) => this.error.set(err.error?.message || 'Failed to delete project'),
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
