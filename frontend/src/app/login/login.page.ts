import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="ion-padding" style="--background: #0a0a0f;">
      <div class="auth-container">
        <h1>PhotoPin</h1>
        <p class="subtitle">{{ isRegister ? 'Crear cuenta' : 'Iniciar sesión' }}</p>

        <div class="input-group" *ngIf="isRegister">
          <label>Usuario</label>
          <input [(ngModel)]="username" type="text" placeholder="Tu usuario" />
        </div>

        <div class="input-group">
          <label>Email</label>
          <input [(ngModel)]="email" type="email" placeholder="correo@ejemplo.com" />
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input [(ngModel)]="password" type="password" placeholder="••••••••" />
        </div>

        <button class="primary-btn" (click)="submit()" [disabled]="loading">
          <ion-spinner *ngIf="loading" name="crescent" style="width: 20px; height: 20px; color: white;"></ion-spinner>
          <span *ngIf="!loading">{{ isRegister ? 'Registrarse' : 'Entrar' }}</span>
        </button>

        <ion-text color="danger" *ngIf="error">
          <p class="ion-text-center">{{ error }}</p>
        </ion-text>

        <p class="ion-text-center toggle-link" (click)="toggleMode()">
          {{ isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
        </p>
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-container {
      max-width: 400px;
      margin: 0 auto;
      padding-top: 80px;
    }
    h1 {
      text-align: center;
      font-size: 2rem;
      font-weight: bold;
      color: #fff;
    }
    .subtitle {
      text-align: center;
      color: rgba(255,255,255,0.5);
      margin-bottom: 24px;
    }
    .toggle-link {
      cursor: pointer;
      color: #FF6B00;
      margin-top: 24px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }
    .input-group label {
      color: rgba(255,255,255,0.7);
      font-size: 0.85rem;
      margin-bottom: 8px;
      font-weight: 600;
      text-align: left;
    }
    .input-group input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: all 0.3s;
      width: 100%;
    }
    .input-group input:focus {
      border-color: #FF6B00;
      background: rgba(255,255,255,0.1);
    }
    .primary-btn {
      width: 100%;
      background: #428cff;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      margin-top: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      transition: opacity 0.2s;
    }
    .primary-btn:active {
      opacity: 0.8;
    }
    .primary-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoginPage {
  email = '';
  password = '';
  username = '';
  isRegister = false;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
  }

  submit() {
    this.error = '';
    this.loading = true;

    const obs = this.isRegister
      ? this.authService.register(this.username, this.email, this.password)
      : this.authService.login(this.email, this.password);

    obs.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status) {
          this.router.navigateByUrl('/home');
        } else {
          this.error = res.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error de conexión';
      }
    });
  }
}
