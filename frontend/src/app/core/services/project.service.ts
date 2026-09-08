import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Project,
  ProjectActivity,
  ProjectMember,
  ProjectRequest,
} from '../models/project.model';
import { PageResponse } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly API = '/api/projects';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.API);
  }

  getAllPaged(page: number, size: number): Observable<PageResponse<Project>> {
    return this.http.get<PageResponse<Project>>(this.API, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.API}/${id}`);
  }

  create(data: ProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.API, data);
  }

  update(id: number, data: ProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.API}/${id}`, data);
  }

  archive(id: number): Observable<Project> {
    return this.http.patch<Project>(`${this.API}/${id}/archive`, {});
  }

  restore(id: number): Observable<Project> {
    return this.http.patch<Project>(`${this.API}/${id}/restore`, {});
  }

  getMembers(id: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.API}/${id}/members`);
  }

  inviteMember(id: number, email: string): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`${this.API}/${id}/members`, { email });
  }

  removeMember(id: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}/members/${userId}`);
  }

  getActivities(id: number): Observable<ProjectActivity[]> {
    return this.http.get<ProjectActivity[]>(`${this.API}/${id}/activities`);
  }

  getActivitiesPaged(id: number, page: number, size: number): Observable<PageResponse<ProjectActivity>> {
    return this.http.get<PageResponse<ProjectActivity>>(`${this.API}/${id}/activities`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
