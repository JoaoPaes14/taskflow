import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SubtaskService {
  private readonly API = '/api';

  constructor(private http: HttpClient) {}

  getSubtasks(taskId: number): Observable<Subtask[]> {
    return this.http.get<Subtask[]>(`${this.API}/tasks/${taskId}/subtasks`);
  }

  createSubtask(taskId: number, title: string): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.API}/tasks/${taskId}/subtasks`, { title });
  }

  toggleSubtask(taskId: number, subtaskId: number): Observable<Subtask> {
    return this.http.patch<Subtask>(`${this.API}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {});
  }

  deleteSubtask(taskId: number, subtaskId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/tasks/${taskId}/subtasks/${subtaskId}`);
  }
}
