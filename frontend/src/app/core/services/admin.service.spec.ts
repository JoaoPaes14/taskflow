import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users', () => {
    const mockUsers = [
      { userId: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' as const },
      { userId: 2, name: 'Member', email: 'member@test.com', role: 'MEMBER' as const },
    ];

    service.getUsers().subscribe((res) => {
      expect(res).toEqual(mockUsers);
      expect(res.length).toBe(2);
    });

    const req = httpMock.expectOne('/api/admin/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should update user role', () => {
    const userId = 2;
    const role = 'MANAGER' as const;
    const mockResult = { userId: 2, name: 'Member', email: 'member@test.com', role: 'MANAGER' };

    service.updateUserRole(userId, role).subscribe((res) => {
      expect(res).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`/api/admin/users/${userId}/role?role=${role}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(mockResult);
  });
});
