import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SubtaskService } from './subtask.service';

describe('SubtaskService', () => {
  let service: SubtaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubtaskService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubtaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get subtasks for a task', () => {
    const taskId = 1;
    const mockSubtasks = [
      { id: 1, taskId: 1, title: 'Sub A', completed: false, position: 0, createdAt: '2026-01-01' },
    ];

    service.getSubtasks(taskId).subscribe((res) => {
      expect(res).toEqual(mockSubtasks);
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/subtasks`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSubtasks);
  });

  it('should create a subtask', () => {
    const taskId = 1;
    const title = 'New sub';
    const mockResult = { id: 2, taskId: 1, title, completed: false, position: 1, createdAt: '2026-01-01' };

    service.createSubtask(taskId, title).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/subtasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title });
    req.flush(mockResult);
  });

  it('should toggle a subtask', () => {
    const taskId = 1;
    const subtaskId = 2;
    const mockResult = { id: 2, taskId: 1, title: 'Sub', completed: true, position: 0, createdAt: '2026-01-01' };

    service.toggleSubtask(taskId, subtaskId).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(mockResult);
  });

  it('should delete a subtask', () => {
    const taskId = 1;
    const subtaskId = 2;

    service.deleteSubtask(taskId, subtaskId).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
