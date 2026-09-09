import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Board } from './board';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { Project, ProjectActivity, ProjectMember } from '../../../core/models/project.model';
import { ProjectTask, TaskComment } from '../../../core/models/task.model';

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;
  let projects: {
    getById: ReturnType<typeof vi.fn>;
    getMembers: ReturnType<typeof vi.fn>;
    getActivities: ReturnType<typeof vi.fn>;
  };
  let tasks: {
    getTasks: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    getComments: ReturnType<typeof vi.fn>;
    addComment: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const mockProject: Project = {
    id: 1,
    name: 'Site',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    createdById: 1,
    createdByName: 'João',
  };

  const mockMember: ProjectMember = {
    id: 10,
    userId: 2,
    name: 'Maria',
    email: 'maria@x.com',
    role: 'MEMBER',
    projectRole: 'MEMBER',
    joinedAt: '2026-01-01T00:00:00',
  };

  const mockTask: ProjectTask = {
    id: 100,
    projectId: 1,
    title: 'Tarefa 1',
    status: 'TODO',
    priority: 'MEDIUM',
    position: 0,
    createdById: 1,
    createdByName: 'João',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  };

  const mockComment: TaskComment = {
    id: 5,
    taskId: 100,
    authorId: 1,
    authorName: 'João',
    content: 'Comentário',
    createdAt: '2026-01-02T00:00:00',
  };

  const mockActivity: ProjectActivity = {
    id: 1,
    projectId: 1,
    actorId: 1,
    actorName: 'João',
    action: 'TASK_CREATED',
    message: 'João criou a tarefa Tarefa 1',
    createdAt: '2026-01-01T00:00:00',
  };

  beforeEach(async () => {
    projects = {
      getById: vi.fn(),
      getMembers: vi.fn(),
      getActivities: vi.fn(),
    };
    tasks = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      deleteTask: vi.fn(),
      getComments: vi.fn(),
      addComment: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projects },
        { provide: TaskService, useValue: tasks },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { currentUser: () => ({ userId: 1 }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load project, members and tasks on init', () => {
    projects.getById.mockReturnValue(of(mockProject));
    projects.getMembers.mockReturnValue(of([mockMember]));
    tasks.getTasks.mockReturnValue(of([mockTask]));

    component.ngOnInit();

    expect(component.project()?.name).toBe('Site');
    expect(component.members()).toEqual([mockMember]);
    expect(component.tasksList()).toEqual([mockTask]);
  });

  it('should group tasks by status column', () => {
    component.tasksList.set([mockTask]);
    expect(component.getTasks('TODO')).toEqual([mockTask]);
    expect(component.getTasks('DONE')).toEqual([]);
  });

  it('should open create modal with empty form', () => {
    component.openCreate('IN_PROGRESS');
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
    expect(component.formTitle).toBe('');
  });

  it('should open edit modal and load comments', () => {
    tasks.getComments.mockReturnValue(of([mockComment]));

    component.openEdit(mockTask);

    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.formTitle).toBe('Tarefa 1');
    expect(tasks.getComments).toHaveBeenCalledWith(100);
    expect(component.comments()).toEqual([mockComment]);
  });

  it('should change task status through the service', () => {
    const moved = { ...mockTask, status: 'DONE' as const, position: 0 };
    tasks.updateTaskStatus.mockReturnValue(of(moved));
    component.tasksList.set([mockTask]);

    component.changeStatus({ ...mockTask }, 'DONE');

    expect(tasks.updateTaskStatus).toHaveBeenCalledWith(100, { status: 'DONE', position: 0 });
    expect(component.tasksList()[0].status).toBe('DONE');
  });

  it('should submit a comment and append it', () => {
    component.editingId.set(100);
    component.commentText = 'novo comentário';
    tasks.addComment.mockReturnValue(of({ ...mockComment, content: 'novo comentário' }));

    component.submitComment();

    expect(tasks.addComment).toHaveBeenCalledWith(100, { content: 'novo comentário' });
    expect(component.comments()).toHaveLength(1);
    expect(component.commentText).toBe('');
  });

  it('should not submit an empty comment', () => {
    component.editingId.set(100);
    component.commentText = '   ';
    component.submitComment();

    expect(tasks.addComment).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should load activities and open the panel', () => {
    projects.getActivities.mockReturnValue(of([mockActivity]));
    component.project.set(mockProject);

    component.toggleActivity();

    expect(projects.getActivities).toHaveBeenCalledWith(1);
    expect(component.activities()).toEqual([mockActivity]);
    expect(component.showActivity()).toBe(true);
  });

  it('should close the activity panel', () => {
    component.showActivity.set(true);
    component.closeActivity();
    expect(component.showActivity()).toBe(false);
  });

  it('should show toast error when deleting fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    tasks.deleteTask.mockReturnValue(throwError(() => ({ error: { message: 'Erro ao excluir' } })));
    component.tasksList.set([mockTask]);

    component.onDelete(mockTask);

    expect(toast.error).toHaveBeenCalledWith('Erro ao excluir');
  });
});
