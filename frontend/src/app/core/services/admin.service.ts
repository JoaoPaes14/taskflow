import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/auth.model';

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = '/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AuthResponse[]> {
    return this.http.get<AuthResponse[]>(`${this.API}/users`);
  }

  updateUserRole(userId: number, role: UserRole): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.API}/users/${userId}/role?role=${role}`, {});
  }
}
