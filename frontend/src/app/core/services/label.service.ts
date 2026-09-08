import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskLabel } from '../models/task.model';

export interface TaskLabelRequest {
  name: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class LabelService {
  private readonly API = '/api';

  constructor(private http: HttpClient) {}

  getLabels(projectId: number): Observable<TaskLabel[]> {
    return this.http.get<TaskLabel[]>(`${this.API}/projects/${projectId}/labels`);
  }

  createLabel(projectId: number, data: TaskLabelRequest): Observable<TaskLabel> {
    return this.http.post<TaskLabel>(`${this.API}/projects/${projectId}/labels`, data);
  }

  updateLabel(projectId: number, labelId: number, data: TaskLabelRequest): Observable<TaskLabel> {
    return this.http.put<TaskLabel>(`${this.API}/projects/${projectId}/labels/${labelId}`, data);
  }

  deleteLabel(projectId: number, labelId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/projects/${projectId}/labels/${labelId}`);
  }
}
