import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationId = 0;
  notifications = signal<Notification[]>([]);

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 5000) {
    const id = ++this.notificationId;
    const notification: Notification = { id, type, title, message };
    
    this.notifications.update(notifications => [...notifications, notification]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(title: string, message: string, duration?: number) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number) {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number) {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number) {
    this.show('info', title, message, duration);
  }

  remove(id: number) {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }
}
