import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LabelService } from './label.service';

describe('LabelService', () => {
  let service: LabelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LabelService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LabelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get labels for a project', () => {
    const projectId = 1;
    const mockLabels = [{ id: 1, projectId: 1, name: 'Bug', color: '#ff0000' }];

    service.getLabels(projectId).subscribe((res) => {
      expect(res).toEqual(mockLabels);
    });

    const req = httpMock.expectOne(`/api/projects/${projectId}/labels`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLabels);
  });

  it('should create a label', () => {
    const projectId = 1;
    const data = { name: 'Feature', color: '#00ff00' };
    const mockResult = { id: 2, projectId: 1, ...data };

    service.createLabel(projectId, data).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/projects/${projectId}/labels`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush(mockResult);
  });

  it('should update a label', () => {
    const projectId = 1;
    const labelId = 2;
    const data = { name: 'Updated', color: '#0000ff' };
    const mockResult = { id: 2, projectId: 1, ...data };

    service.updateLabel(projectId, labelId, data).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/projects/${projectId}/labels/${labelId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(data);
    req.flush(mockResult);
  });

  it('should delete a label', () => {
    const projectId = 1;
    const labelId = 2;

    service.deleteLabel(projectId, labelId).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`/api/projects/${projectId}/labels/${labelId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
