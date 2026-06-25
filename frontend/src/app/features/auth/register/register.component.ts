import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { FieldErrors, parseApiError } from '../../../core/http-error';

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
  fieldErrors = signal<FieldErrors>({});
  showPassword = signal(false);

  errorsFor(field: string): string[] {
    return this.fieldErrors()[field] ?? [];
  }

  submit(): void {
    this.error.set('');
    this.fieldErrors.set({});
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        const parsed = parseApiError(err, 'Falha ao cadastrar');
        this.fieldErrors.set(parsed.fieldErrors);
        // Só mostra a mensagem geral quando não há erro de campo específico
        this.error.set(Object.keys(parsed.fieldErrors).length ? '' : parsed.message);
        this.loading.set(false);
      },
    });
  }
}
