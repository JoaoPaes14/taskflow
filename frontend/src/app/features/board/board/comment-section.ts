import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TaskComment } from '../../../core/models/task.model';

@Component({
  selector: 'app-comment-section',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="comments-section">
      <h3 class="section-title">Comentarios ({{ comments().length }})</h3>
      @if (loading()) {
        <p class="section-empty">Carregando comentarios...</p>
      } @else {
        <div class="comments-list">
          @for (c of comments(); track c.id) {
            <div class="comment-item">
              <span class="comment-avatar">{{ getInitial(c.authorName) }}</span>
              <div class="comment-body">
                <div class="comment-head">
                  <strong>{{ c.authorName }}</strong>
                  <span class="comment-date">{{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                  @if (isOwnComment(c)) {
                    <div class="comment-actions">
                      <button type="button" class="comment-action-btn" (click)="startEdit.emit(c)">
                        Editar
                      </button>
                      <button
                        type="button"
                        class="comment-action-btn danger"
                        (click)="deleteComment.emit({ taskId: c.taskId, commentId: c.id })"
                      >
                        Excluir
                      </button>
                    </div>
                  }
                </div>
                @if (editingId() === c.id) {
                  <div class="comment-edit-form">
                    <textarea rows="2" [(ngModel)]="editingContent" name="editComment"></textarea>
                    <div class="comment-edit-btns">
                      <button type="button" class="btn-primary btn-xs" (click)="onSaveEdit(c)">
                        Salvar
                      </button>
                      <button type="button" class="btn-ghost btn-xs" (click)="cancelEdit.emit()">
                        Cancelar
                      </button>
                    </div>
                  </div>
                } @else {
                  <p>{{ c.content }}</p>
                }
              </div>
            </div>
          } @empty {
            <p class="section-empty">Nenhum comentario ainda.</p>
          }
        </div>
        @if (hasMore()) {
          <button type="button" class="load-more-btn" (click)="loadMore.emit()">
            Carregar mais comentarios
          </button>
        }
      }
      <div class="comment-form">
        <textarea
          rows="2"
          [(ngModel)]="commentText"
          name="commentContent"
          placeholder="Escreva um comentario..."
        ></textarea>
        <button
          type="button"
          class="btn-primary btn-sm"
          [disabled]="submitting() || !commentText.trim()"
          (click)="onSubmitComment()"
        >
          {{ submitting() ? 'Enviando...' : 'Comentar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .comments-section {
        margin-top: 1.5rem;
        border-top: 1px solid var(--border);
        padding-top: 1.25rem;
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
      .comments-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 0.75rem;
      }
      .comment-item {
        display: flex;
        gap: 0.6rem;
      }
      .comment-avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.68rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .comment-body {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        flex: 1;
      }
      .comment-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.15rem;
      }
      .comment-head strong {
        font-size: 0.78rem;
      }
      .comment-date {
        font-size: 0.68rem;
        color: var(--text-muted);
      }
      .comment-actions {
        display: flex;
        gap: 0.3rem;
        margin-left: auto;
      }
      .comment-action-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 0.68rem;
        cursor: pointer;
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
        transition: all 0.15s;
      }
      .comment-action-btn:hover {
        color: var(--primary);
        background: var(--primary-soft);
      }
      .comment-action-btn.danger:hover {
        color: var(--danger);
        background: var(--danger-soft);
      }
      .comment-edit-form {
        margin-top: 0.3rem;
      }
      .comment-edit-form textarea {
        width: 100%;
        padding: 0.4rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 0.78rem;
        resize: vertical;
        font-family: inherit;
        background: var(--bg);
        color: var(--text);
      }
      .comment-edit-btns {
        display: flex;
        gap: 0.3rem;
        margin-top: 0.3rem;
      }
      .comment-body p {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .comment-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .comment-form textarea {
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.6rem 0.8rem;
        resize: vertical;
      }
      .comment-form textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }
      .comment-form button {
        align-self: flex-end;
      }
      .load-more-btn {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.5rem;
        border: 1px dashed var(--border);
        border-radius: 8px;
        background: none;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--primary);
        cursor: pointer;
        transition: all 0.15s;
      }
      .load-more-btn:hover {
        background: var(--primary-soft);
        border-color: var(--primary);
      }
      .btn-primary {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        background: var(--primary);
        color: white;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-xs {
        padding: 0.3rem 0.6rem;
        font-size: 0.72rem;
      }
      .btn-ghost {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid var(--border);
      }
      .btn-ghost:hover {
        background: var(--surface-hover);
      }
    `,
  ],
})
export class CommentSectionComponent {
  comments = input.required<TaskComment[]>();
  loading = input(false);
  hasMore = input(false);
  submitting = input(false);
  editingId = input<number | null>(null);
  currentUserId = input<number>(0);

  submitComment = output<string>();
  loadMore = output<void>();
  startEdit = output<TaskComment>();
  cancelEdit = output<void>();
  saveEdit = output<{ taskId: number; commentId: number; content: string }>();
  deleteComment = output<{ taskId: number; commentId: number }>();

  commentText = '';
  editingContent = '';

  getInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  isOwnComment(comment: TaskComment): boolean {
    return comment.authorId === this.currentUserId();
  }

  onSubmitComment(): void {
    if (!this.commentText.trim()) return;
    this.submitComment.emit(this.commentText.trim());
    this.commentText = '';
  }

  onSaveEdit(comment: TaskComment): void {
    if (!this.editingContent.trim()) return;
    this.saveEdit.emit({
      taskId: comment.taskId,
      commentId: comment.id,
      content: this.editingContent.trim(),
    });
  }
}
