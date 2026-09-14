import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have unreadCount signal initialized to 0', () => {
    expect(service.unreadCount()).toBe(0);
  });

  it('should get notifications with pagination', () => {
    const mockPage = {
      content: [
        {
          id: 1,
          type: 'TASK_ASSIGNED',
          message: 'You were assigned',
          read: false,
          createdAt: '2026-01-01',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    };

    service.getNotifications(0, 20).subscribe((res) => {
      expect(res).toEqual(mockPage);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/notifications');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  it('should get unread count', () => {
    service.getUnreadCount().subscribe((count) => {
      expect(count).toBe(3);
    });

    const req = httpMock.expectOne('/api/notifications/unread-count');
    expect(req.request.method).toBe('GET');
    req.flush(3);
  });

  it('should mark a notification as read', () => {
    service.markAsRead(1).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne('/api/notifications/1/read');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('should mark all notifications as read', () => {
    service.markAllAsRead().subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne('/api/notifications/read-all');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('should refresh unread count and update signal', () => {
    service.refreshUnreadCount();

    const req = httpMock.expectOne('/api/notifications/unread-count');
    req.flush(5);

    expect(service.unreadCount()).toBe(5);
  });
});
