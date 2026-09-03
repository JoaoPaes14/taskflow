import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { Project, ProjectRequest } from '../models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const mockProject: Project = {
    id: 1,
    name: 'Site',
    description: 'Desc',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    createdById: 1,
    createdByName: 'João',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ProjectService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET all projects', () => {
    service.getAll().subscribe((list) => {
      expect(list).toEqual([mockProject]);
    });

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush([mockProject]);
  });

  it('should GET project by id', () => {
    service.getById(1).subscribe((p) => {
      expect(p).toEqual(mockProject);
    });

    const req = httpMock.expectOne('/api/projects/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  it('should POST to create a project', () => {
    const payload: ProjectRequest = { name: 'Novo', description: 'desc' };
    service.create(payload).subscribe((p) => {
      expect(p).toEqual(mockProject);
    });

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockProject);
  });

  it('should PUT to update a project', () => {
    const payload: ProjectRequest = { name: 'Atualizado' };
    service.update(1, payload).subscribe((p) => {
      expect(p).toEqual(mockProject);
    });

    const req = httpMock.expectOne('/api/projects/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockProject);
  });

  it('should DELETE a project', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('/api/projects/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should PATCH to archive a project', () => {
    service.archive(1).subscribe((p) => {
      expect(p).toEqual(mockProject);
    });

    const req = httpMock.expectOne('/api/projects/1/archive');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockProject);
  });

  it('should PATCH to restore a project', () => {
    service.restore(1).subscribe((p) => {
      expect(p).toEqual(mockProject);
    });

    const req = httpMock.expectOne('/api/projects/1/restore');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockProject);
  });
});
