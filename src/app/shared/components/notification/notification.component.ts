import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      <div 
        *ngFor="let notification of notificationService.notifications()"
        class="bg-white rounded-xl shadow-2xl border-l-4 overflow-hidden transform transition-all duration-300 animate-slide-in"
        [class.border-green-500]="notification.type === 'success'"
        [class.border-red-500]="notification.type === 'error'"
        [class.border-yellow-500]="notification.type === 'warning'"
        [class.border-blue-500]="notification.type === 'info'"
      >
        <div class="p-4 flex items-start gap-3">
          <!-- Ícone -->
          <div class="flex-shrink-0">
            <svg 
              *ngIf="notification.type === 'success'"
              class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg 
              *ngIf="notification.type === 'error'"
              class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg 
              *ngIf="notification.type === 'warning'"
              class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg 
              *ngIf="notification.type === 'info'"
              class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Conteúdo -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-slate-900 mb-1">
              {{ notification.title }}
            </h3>
            <p class="text-sm text-slate-600">
              {{ notification.message }}
            </p>
          </div>

          <!-- Botão fechar -->
          <button 
            (click)="notificationService.remove(notification.id)"
            class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
