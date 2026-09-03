import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.error.set('');
    this.auth
      .register({ name: this.name, email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => this.error.set(err.error?.message || 'Registration failed'),
      });
  }
}
