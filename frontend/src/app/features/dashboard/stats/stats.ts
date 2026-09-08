import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { ProjectStats } from '../../../core/services/task.service';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-stats',
  standalone: true,
  template: `
    <div class="stats-section">
      <h2 class="stats-title">Estatisticas do projeto</h2>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Status das tarefas</h3>
          <div class="chart-wrap">
            <canvas #statusChart></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3>Prioridade</h3>
          <div class="chart-wrap">
            <canvas #priorityChart></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3>Por membro</h3>
          <div class="chart-wrap">
            <canvas #assigneeChart></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-section { margin-bottom: 1.5rem; }
    .stats-title { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      h3 { font-size: 0.82rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--text-muted); }
    }
    .chart-wrap { position: relative; height: 180px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
  `]
})
export class StatsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() stats: ProjectStats | null = null;
  @ViewChild('statusChart') statusRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assigneeChart') assigneeRef!: ElementRef<HTMLCanvasElement>;

  private statusChart: Chart | null = null;
  private priorityChart: Chart | null = null;
  private assigneeChart: Chart | null = null;
  private initialized = false;

  ngAfterViewInit(): void {
    this.initialized = true;
    if (this.stats) this.renderCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.initialized && this.stats) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.priorityChart?.destroy();
    this.assigneeChart?.destroy();
  }

  private renderCharts(): void {
    if (!this.stats) return;
    this.renderStatus();
    this.renderPriority();
    this.renderAssignee();
  }

  private renderStatus(): void {
    this.statusChart?.destroy();
    const s = this.stats!;
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['A fazer', 'Em progresso', 'Concluido'],
        datasets: [{
          data: [s.todoTasks, s.inProgressTasks, s.doneTasks],
          backgroundColor: ['#f59e0b', '#6366f1', '#10b981'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } } }
      } as any
    };
    this.statusChart = new Chart(this.statusRef.nativeElement, config);
  }

  private renderPriority(): void {
    this.priorityChart?.destroy();
    const p = this.stats!.tasksByPriority;
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Baixa', 'Media', 'Alta'],
        datasets: [{
          data: [p['LOW'] || 0, p['MEDIUM'] || 0, p['HIGH'] || 0],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } } }
      } as any
    };
    this.priorityChart = new Chart(this.priorityRef.nativeElement, config);
  }

  private renderAssignee(): void {
    this.assigneeChart?.destroy();
    const a = this.stats!.tasksByAssignee;
    const names = Object.keys(a);
    const values = Object.values(a);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: names.length > 0 ? names : ['Sem atribuicao'],
        datasets: [{
          data: names.length > 0 ? values : [1],
          backgroundColor: names.length > 0 ? colors.slice(0, names.length) : ['#d1d5db'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } } }
      } as any
    };
    this.assigneeChart = new Chart(this.assigneeRef.nativeElement, config);
  }
}
