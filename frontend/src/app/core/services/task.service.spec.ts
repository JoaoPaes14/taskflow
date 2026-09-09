import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { ProjectTask, TaskComment } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: ProjectTask = {
    id: 1,
    projectId: 10,
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
    taskId: 1,
    authorId: 1,
    authorName: 'João',
    content: 'Comentário',
    createdAt: '2026-01-02T00:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET tasks of a project', () => {
    service.getTasks(10).subscribe((list) => {
      expect(list).toEqual([mockTask]);
    });

    const req = httpMock.expectOne('/api/projects/10/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should POST to create a task', () => {
    service.createTask(10, { title: 'Nova' }).subscribe((t) => {
      expect(t).toEqual(mockTask);
    });

    const req = httpMock.expectOne('/api/projects/10/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Nova' });
    req.flush(mockTask);
  });

  it('should PUT to update a task', () => {
    service.updateTask(1, { title: 'Atualizada' }).subscribe((t) => {
      expect(t).toEqual(mockTask);
    });

    const req = httpMock.expectOne('/api/tasks/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Atualizada' });
    req.flush(mockTask);
  });

  it('should PATCH task status', () => {
    service.updateTaskStatus(1, { status: 'DONE', position: 2 }).subscribe((t) => {
      expect(t).toEqual(mockTask);
    });

    const req = httpMock.expectOne('/api/tasks/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'DONE', position: 2 });
    req.flush(mockTask);
  });

  it('should DELETE a task', () => {
    service.deleteTask(1).subscribe();

    const req = httpMock.expectOne('/api/tasks/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should GET comments of a task', () => {
    service.getComments(1).subscribe((list) => {
      expect(list).toEqual([mockComment]);
    });

    const req = httpMock.expectOne('/api/tasks/1/comments');
    expect(req.request.method).toBe('GET');
    req.flush([mockComment]);
  });

  it('should POST a comment', () => {
    service.addComment(1, { content: 'oi' }).subscribe((c) => {
      expect(c).toEqual(mockComment);
    });

    const req = httpMock.expectOne('/api/tasks/1/comments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'oi' });
    req.flush(mockComment);
  });
});
