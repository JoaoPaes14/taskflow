import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  private toast = inject(ToastService);
  readonly list = this.toast.list;

  dismiss(id: number): void {
    this.toast.dismiss(id);
  }
}
