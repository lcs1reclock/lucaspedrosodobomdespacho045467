import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  ngOnInit() {
    // Se já está autenticado, redireciona para pets
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/pets']);
    }
  }

  login() {
    if (!this.username() || !this.password()) {
      this.error.set('Por favor, preencha usuário e senha');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({
      username: this.username(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/pets']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.error.set('Usuário ou senha inválidos');
        } else if (err.status === 0) {
          this.error.set('Erro de conexão. Verifique sua internet.');
        } else {
          this.error.set('Erro ao fazer login. Tente novamente.');
        }
        // console.error('Erro no login:', err);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  onUsernameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.username.set(input.value);
  }

  onPasswordChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }
}
