import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { Project } from '../../../core/models/project.model';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let projects: { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; archive: ReturnType<typeof vi.fn>; restore: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Site',
      description: 'Site corporativo',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      createdById: 1,
      createdByName: 'João',
    },
    {
      id: 2,
      name: 'App',
      description: '',
      status: 'ARCHIVED',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      createdById: 1,
      createdByName: 'João',
    },
  ];

  beforeEach(async () => {
    projects = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projects },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    projects.getAll.mockReturnValue(of(mockProjects));
    component.ngOnInit();
    expect(component.projectsList()).toEqual(mockProjects);
    expect(component.totalProjects()).toBe(2);
    expect(component.activeProjects()).toBe(1);
    expect(component.archivedProjects()).toBe(1);
  });

  it('should show toast error when load fails', () => {
    projects.getAll.mockReturnValue(throwError(() => ({ error: { message: 'Falha ao carregar' } })));
    component.ngOnInit();
    expect(toast.error).toHaveBeenCalledWith('Falha ao carregar');
  });

  it('should filter projects by search term', () => {
    component.projectsList.set(mockProjects);
    component.searchTerm.set('site');
    expect(component.filteredProjects().length).toBe(1);
    expect(component.filteredProjects()[0].name).toBe('Site');
  });

  it('should filter projects by status', () => {
    component.projectsList.set(mockProjects);
    component.statusFilter.set('ACTIVE');
    expect(component.filteredProjects().length).toBe(1);
    expect(component.filteredProjects()[0].status).toBe('ACTIVE');
  });

  it('should open create modal with empty form', () => {
    component.openCreate();
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
    expect(component.formName).toBe('');
  });

  it('should open edit modal with project data', () => {
    component.openEdit(mockProjects[0]);
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.formName).toBe('Site');
    expect(component.editingId()).toBe(1);
  });

  it('should close modal', () => {
    component.showModal.set(true);
    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should reject submitting with empty name', () => {
    component.formName = '';
    component.submit();
    expect(projects.create).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should create a project', () => {
    projects.create.mockReturnValue(of(mockProjects[0]));
    component.formName = 'Novo Projeto';
    component.formDescription = '';
    component.submit();
    expect(projects.create).toHaveBeenCalledWith({ name: 'Novo Projeto', description: undefined });
    expect(component.projectsList()).toContain(mockProjects[0]);
    expect(component.showModal()).toBe(false);
  });

  it('should update a project', () => {
    component.projectsList.set(mockProjects);
    const updated = { ...mockProjects[0], name: 'Site Atualizado' };
    projects.update.mockReturnValue(of(updated));

    component.openEdit(mockProjects[0]);
    component.formName = 'Site Atualizado';
    component.submit();

    expect(projects.update).toHaveBeenCalledWith(1, { name: 'Site Atualizado', description: 'Site corporativo' });
    expect(component.projectsList()[0].name).toBe('Site Atualizado');
  });

  it('should delete a project when confirmed', () => {
    component.projectsList.set(mockProjects);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    projects.delete.mockReturnValue(of(undefined));

    component.onDelete(mockProjects[0]);

    expect(projects.delete).toHaveBeenCalledWith(1);
    expect(component.projectsList().length).toBe(1);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should not delete a project when not confirmed', () => {
    component.projectsList.set(mockProjects);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.onDelete(mockProjects[0]);

    expect(projects.delete).not.toHaveBeenCalled();
    expect(component.projectsList().length).toBe(2);
  });

  it('should set status filter', () => {
    component.setStatusFilter('ARCHIVED');
    expect(component.statusFilter()).toBe('ARCHIVED');
  });

  it('should translate known status labels to Portuguese', () => {
    expect(component.statusLabel('ACTIVE')).toBe('Ativo');
    expect(component.statusLabel('ARCHIVED')).toBe('Arquivado');
    expect(component.statusLabel('DELETED')).toBe('Excluído');
  });

  it('should fall back to the raw status when label is unknown', () => {
    expect(component.statusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should reset submitting state when opening the create modal', () => {
    component.submitting.set(true);
    component.openCreate();
    expect(component.submitting()).toBe(false);
  });

  it('should prevent double submission while a request is in flight', () => {
    component.submitting.set(true);
    component.formName = 'Projeto';
    component.submit();
    expect(projects.create).not.toHaveBeenCalled();
    expect(projects.update).not.toHaveBeenCalled();
  });

  it('should set submitting true during creation', () => {
    projects.create.mockReturnValue({ subscribe: () => {} } as never);
    component.formName = 'Novo';
    component.submit();
    expect(component.submitting()).toBe(true);
    expect(projects.create).toHaveBeenCalled();
  });

  it('should archive a project', () => {
    component.projectsList.set(mockProjects);
    const archived = { ...mockProjects[0], status: 'ARCHIVED' as const };
    projects.archive.mockReturnValue(of(archived));

    component.onArchive(mockProjects[0]);

    expect(projects.archive).toHaveBeenCalledWith(1);
    expect(component.projectsList()[0].status).toBe('ARCHIVED');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should restore a project', () => {
    component.projectsList.set(mockProjects);
    const restored = { ...mockProjects[1], status: 'ACTIVE' as const };
    projects.restore.mockReturnValue(of(restored));

    component.onRestore(mockProjects[1]);

    expect(projects.restore).toHaveBeenCalledWith(2);
    expect(component.projectsList()[1].status).toBe('ACTIVE');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should sort projects by name', () => {
    component.projectsList.set([mockProjects[0], mockProjects[1]]);
    component.setSortBy('name');
    expect(component.filteredProjects()[0].name).toBe('App');
    expect(component.filteredProjects()[1].name).toBe('Site');
  });

  it('should sort projects by most recent by default', () => {
    const older = { ...mockProjects[0], updatedAt: '2026-01-01T00:00:00' };
    const newer = { ...mockProjects[1], updatedAt: '2026-02-01T00:00:00' };
    component.projectsList.set([older, newer]);
    component.setSortBy('recent');
    expect(component.filteredProjects()[0].name).toBe(newer.name);
  });
});
