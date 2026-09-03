import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  name = '';
  email = '';
  password = '';
  error = signal('');

  onSubmit(): void {
    this.error.set('');
    this.auth
      .register({ name: this.name, email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.toast.success('Conta criada com sucesso! Bem-vindo ao TaskFlow!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const msg = err.error?.message || 'Não foi possível criar a conta.';
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }
}
