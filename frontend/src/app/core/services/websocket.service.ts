import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationService } from './notification.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;
  private notificationApi = inject(NotificationService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  connected = signal(false);

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`/ws?token=${token}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected.set(true);
        this.notificationApi.refreshUnreadCount();

        this.client!.subscribe('/user/notifications', (message: IMessage) => {
          const notification: Notification = JSON.parse(message.body);
          this.notificationApi.unreadCount.update((c) => c + 1);
          this.toast.info(notification.message);
        });
      },
      onDisconnect: () => {
        this.connected.set(false);
      },
      onStompError: () => {
        this.connected.set(false);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      this.connected.set(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
