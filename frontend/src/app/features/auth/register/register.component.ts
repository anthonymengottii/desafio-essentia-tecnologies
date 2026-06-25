import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Falha ao cadastrar');
        this.loading.set(false);
      },
    });
  }
}
