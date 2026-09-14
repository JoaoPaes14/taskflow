import { Component, input, output, signal } from '@angular/core';
import { Attachment } from '../../../core/models/task.model';

@Component({
  selector: 'app-attachment-list',
  template: `
    <div class="attachments-section">
      <h3 class="section-title">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
          />
        </svg>
        Anexos ({{ attachments().length }})
      </h3>
      @if (loading()) {
        <p class="section-empty">Carregando...</p>
      } @else {
        @if (attachments().length > 0) {
          <div class="attachments-list">
            @for (att of attachments(); track att.id) {
              <div class="attachment-item">
                <span class="attachment-icon" [attr.data-type]="getFileIcon(att.contentType)">
                  @switch (getFileIcon(att.contentType)) {
                    @case ('image') {
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    }
                    @case ('pdf') {
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    }
                    @default {
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    }
                  }
                </span>
                <div class="attachment-info">
                  <span
                    class="attachment-name"
                    (click)="download.emit(att)"
                    title="Clique para baixar"
                    >{{ att.originalFilename }}</span
                  >
                  <span class="attachment-meta"
                    >{{ formatFileSize(att.fileSize) }} &middot; {{ att.uploadedByName }}</span
                  >
                </div>
                <button
                  type="button"
                  class="attachment-delete"
                  title="Remover"
                  (click)="deleteAttachment.emit(att)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            }
          </div>
        }
        <div class="attachment-upload">
          <label class="upload-btn" [class.disabled]="uploading()">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {{ uploading() ? 'Enviando...' : 'Anexar arquivo' }}
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              (change)="onUpload($event)"
              [disabled]="uploading()"
              hidden
            />
          </label>
          <span class="upload-hint">Max 10MB</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .attachments-section {
        margin-top: 1.25rem;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
      }
      .section-title {
        font-size: 0.85rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .section-empty {
        color: var(--text-muted);
        font-size: 0.82rem;
        margin: 0.5rem 0;
      }
      .attachments-list {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 0.75rem;
      }
      .attachment-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.45rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        transition: all 0.15s;
      }
      .attachment-item:hover {
        background: var(--bg);
      }
      .attachment-item:hover .attachment-delete {
        opacity: 1;
      }
      .attachment-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: var(--bg);
        color: var(--text-muted);
      }
      .attachment-icon[data-type='image'] {
        background: #ede9fe;
        color: #7c3aed;
      }
      .attachment-icon[data-type='pdf'] {
        background: #fee2e2;
        color: #dc2626;
      }
      .attachment-icon[data-type='doc'] {
        background: #dbeafe;
        color: #2563eb;
      }
      .attachment-icon[data-type='xls'] {
        background: #dcfce7;
        color: #16a34a;
      }
      .attachment-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .attachment-name {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--primary);
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .attachment-name:hover {
        text-decoration: underline;
      }
      .attachment-meta {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .attachment-delete {
        width: 26px;
        height: 26px;
        border: none;
        border-radius: 6px;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .attachment-delete:hover {
        background: var(--danger-soft);
        color: var(--danger);
      }
      .attachment-upload {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.8rem;
        border: 1px dashed var(--border);
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.15s;
      }
      .upload-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--primary-soft);
      }
      .upload-btn.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      .upload-hint {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    `,
  ],
})
export class AttachmentListComponent {
  attachments = input.required<Attachment[]>();
  loading = input(false);
  uploading = input(false);

  download = output<Attachment>();
  deleteAttachment = output<Attachment>();
  upload = output<File>();

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      this.upload.emit(file);
      input.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType.includes('word') || contentType.includes('document')) return 'doc';
    if (contentType.includes('excel') || contentType.includes('sheet')) return 'xls';
    if (contentType === 'text/plain' || contentType === 'text/csv') return 'txt';
    return 'file';
  }
}
