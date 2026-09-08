import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProjectTask,
  ProjectTaskRequest,
  TaskComment,
  TaskCommentRequest,
  UpdateTaskStatusRequest,
} from '../models/task.model';
import { PageResponse } from '../models/page.model';

export interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  archivedTasks: number;
  tasksByAssignee: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly API = '/api';

  constructor(private http: HttpClient) {}

  getTasks(projectId: number): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.API}/projects/${projectId}/tasks`);
  }

  getTasksPaged(projectId: number, page: number, size: number): Observable<PageResponse<ProjectTask>> {
    return this.http.get<PageResponse<ProjectTask>>(`${this.API}/projects/${projectId}/tasks`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
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

  archiveTask(taskId: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/tasks/${taskId}/archive`, {});
  }

  restoreTask(taskId: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/tasks/${taskId}/restore`, {});
  }

  getStats(projectId: number): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.API}/projects/${projectId}/stats`);
  }

  search(projectId: number, query: string): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.API}/projects/${projectId}/search`, {
      params: { q: query }
    });
  }

  export(projectId: number, format: string): Observable<Blob> {
    return this.http.get(`${this.API}/projects/${projectId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.API}/tasks/${taskId}/comments`);
  }

  getCommentsPaged(taskId: number, page: number, size: number): Observable<PageResponse<TaskComment>> {
    return this.http.get<PageResponse<TaskComment>>(`${this.API}/tasks/${taskId}/comments`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  addComment(taskId: number, data: TaskCommentRequest): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.API}/tasks/${taskId}/comments`, data);
  }
}
