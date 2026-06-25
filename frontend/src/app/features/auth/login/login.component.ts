import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FieldErrors, parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  fieldErrors = signal<FieldErrors>({});

  errorsFor(field: string): string[] {
    return this.fieldErrors()[field] ?? [];
  }

  submit(): void {
    this.error.set('');
    this.fieldErrors.set({});
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        const parsed = parseApiError(err, 'Falha ao entrar');
        this.fieldErrors.set(parsed.fieldErrors);
        this.error.set(Object.keys(parsed.fieldErrors).length ? '' : parsed.message);
        this.loading.set(false);
      },
    });
  }
}
