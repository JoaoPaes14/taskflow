import { Component, Input, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { ProjectTask, TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [],
  template: `
    <div class="calendar-section">
      <div class="cal-header">
        <button class="cal-nav" (click)="prevMonth()">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3>{{ monthLabel() }}</h3>
        <button class="cal-nav" (click)="nextMonth()">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div class="cal-grid">
        @for (day of ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']; track day) {
          <div class="cal-day-header">{{ day }}</div>
        }
        @for (cell of calendarCells(); track cell.date) {
          <div
            class="cal-cell"
            [class.other-month]="cell.isOtherMonth"
            [class.today]="cell.isToday"
          >
            <span class="cal-date">{{ cell.day }}</span>
            @if (cell.tasks.length > 0) {
              <div class="cal-tasks">
                @for (t of cell.tasks.slice(0, 3); track t.id) {
                  <div
                    class="cal-task"
                    [class]="'cal-task-' + t.status.toLowerCase()"
                    [title]="t.title"
                  >
                    {{ t.title }}
                  </div>
                }
                @if (cell.tasks.length > 3) {
                  <span class="cal-more">+{{ cell.tasks.length - 3 }}</span>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .calendar-section {
        margin-bottom: 1.5rem;
      }
      .cal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        h3 {
          font-size: 1rem;
          font-weight: 700;
        }
      }
      .cal-nav {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-muted);
        &:hover {
          color: var(--text);
          border-color: var(--primary);
        }
      }
      .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: var(--border);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .cal-day-header {
        background: var(--bg);
        padding: 0.5rem;
        text-align: center;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-muted);
      }
      .cal-cell {
        background: var(--surface);
        min-height: 80px;
        padding: 0.35rem;
        &.other-month {
          background: var(--bg);
          opacity: 0.5;
        }
        &.today {
          background: var(--primary-soft);
        }
      }
      .cal-date {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        display: block;
        margin-bottom: 0.25rem;
      }
      .cal-tasks {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .cal-task {
        font-size: 0.65rem;
        padding: 1px 4px;
        border-radius: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background: var(--primary-soft);
        color: var(--primary);
        &.cal-task-todo {
          background: var(--warning-soft);
          color: #d97706;
        }
        &.cal-task-in_progress {
          background: var(--primary-soft);
          color: var(--primary);
        }
        &.cal-task-done {
          background: var(--success-soft);
          color: #059669;
        }
      }
      .cal-more {
        font-size: 0.6rem;
        color: var(--text-muted);
        padding: 0 4px;
      }
    `,
  ],
})
export class CalendarComponent implements OnChanges {
  @Input() tasks: ProjectTask[] = [];

  currentMonth = signal(new Date());
  calendarCells = computed(() => this.buildCalendar());
  monthLabel = computed(() => {
    const d = this.currentMonth();
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  });

  ngOnChanges(changes: SimpleChanges): void {}

  prevMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() - 1);
    this.currentMonth.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() + 1);
    this.currentMonth.set(d);
  }

  private buildCalendar(): {
    date: string;
    day: number;
    isOtherMonth: boolean;
    isToday: boolean;
    tasks: ProjectTask[];
  }[] {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const today = new Date().toISOString().slice(0, 10);
    const cells: {
      date: string;
      day: number;
      isOtherMonth: boolean;
      isToday: boolean;
      tasks: ProjectTask[];
    }[] = [];

    const taskMap = new Map<string, ProjectTask[]>();
    for (const t of this.tasks) {
      if (t.dueDate) {
        const list = taskMap.get(t.dueDate) || [];
        list.push(t);
        taskMap.set(t.dueDate, list);
      }
    }

    const start = new Date(year, m, 1 - startOffset);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        date: dateStr,
        day: d.getDate(),
        isOtherMonth: d.getMonth() !== m,
        isToday: dateStr === today,
        tasks: taskMap.get(dateStr) || [],
      });
    }
    return cells;
  }
}
