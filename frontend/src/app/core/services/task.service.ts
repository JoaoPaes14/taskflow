import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectTask, ProjectTaskRequest, UpdateTaskStatusRequest } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly API = '/api';

  constructor(private http: HttpClient) {}

  getTasks(projectId: number): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.API}/projects/${projectId}/tasks`);
  }

  createTask(projectId: number, data: ProjectTaskRequest): Observable<ProjectTask> {
    return this.http.post<ProjectTask>(`${this.API}/projects/${projectId}/tasks`, data);
  }

  updateTask(taskId: number, data: ProjectTaskRequest): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.API}/tasks/${taskId}`, data);
  }

  updateTaskStatus(taskId: number, data: UpdateTaskStatusRequest): Observable<ProjectTask> {
    return this.http.patch<ProjectTask>(`${this.API}/tasks/${taskId}/status`, data);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/tasks/${taskId}`);
  }
}
