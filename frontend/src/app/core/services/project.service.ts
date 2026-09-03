import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectRequest } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly API = '/api/projects';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.API);
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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
