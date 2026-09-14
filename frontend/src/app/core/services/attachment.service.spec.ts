import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AttachmentService } from './attachment.service';

describe('AttachmentService', () => {
  let service: AttachmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttachmentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttachmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get attachments for a task', () => {
    const taskId = 1;
    const mockAttachments = [
      {
        id: 1,
        taskId: 1,
        filename: 'file.txt',
        originalFilename: 'file.txt',
        contentType: 'text/plain',
        fileSize: 100,
        uploadedById: 1,
        uploadedByName: 'User',
        createdAt: '2026-01-01',
      },
    ];

    service.getAttachments(taskId).subscribe((res) => {
      expect(res).toEqual(mockAttachments);
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/attachments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAttachments);
  });

  it('should upload a file', () => {
    const taskId = 1;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockResult = {
      id: 2,
      taskId: 1,
      filename: 'test.txt',
      originalFilename: 'test.txt',
      contentType: 'text/plain',
      fileSize: 7,
      uploadedById: 1,
      uploadedByName: 'User',
      createdAt: '2026-01-01',
    };

    service.upload(taskId, file).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/tasks/${taskId}/attachments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResult);
  });

  it('should delete an attachment', () => {
    const attachmentId = 5;

    service.delete(attachmentId).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`/api/attachments/${attachmentId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should return download URL', () => {
    const url = service.getDownloadUrl(5);
    expect(url).toBe('/api/attachments/5/download');
  });
});
