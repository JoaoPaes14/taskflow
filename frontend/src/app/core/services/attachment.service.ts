import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attachment } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private http = inject(HttpClient);
  private base = '/api';

  getAttachments(taskId: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.base}/tasks/${taskId}/attachments`);
  }

  upload(taskId: number, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${this.base}/tasks/${taskId}/attachments`, formData);
  }

  delete(attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/attachments/${attachmentId}`);
  }

  getDownloadUrl(attachmentId: number): string {
    return `${this.base}/attachments/${attachmentId}/download`;
  }
}
