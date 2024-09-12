import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WindowData } from 'src/models/position';

@Injectable({
  providedIn: 'root'
})

export class WebSocketService {
  private socket: WebSocket;
  private messageSubject: BehaviorSubject<WindowData[]> = new BehaviorSubject<WindowData[]>([]);
  public messages: Observable<WindowData[]> = this.messageSubject.asObservable();

  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000; 

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.socket = new WebSocket('ws://localhost:5000/ws/');

    this.socket.onmessage = (event: MessageEvent) => {
      try {      
        const data: WindowData = JSON.parse(event.data);
        this.updateWindowData(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
      this.reconnect(); 
    };

    this.socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      this.reconnect(); 
    };
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached.');
    }
  }

  private updateWindowData(data: WindowData): void {
    const currentData = this.messageSubject.value;
    const updatedData = currentData.filter(window => window.WindowType !== data.WindowType);
    updatedData.push(data);
    this.messageSubject.next(updatedData);
  }
  
  sendMessage(data: WindowData): Promise<void> {
    return new Promise((resolve, reject) => {
      const send = () => {
        if (this.socket.readyState === WebSocket.OPEN) {
          const jsonString = JSON.stringify(data);
          this.socket.send(jsonString);
          resolve();
        } else if (this.socket.readyState === WebSocket.CONNECTING) {
          
          setTimeout(send, 100); 
        } else {
          console.log('WebSocket is not open, attempting to reconnect.');
          this.reconnect();
          setTimeout(() => {
            send(); 
          }, this.reconnectInterval);
        }
      };

      send(); 
    });
  }

  public removeWindow(windowType: string): void {
    const currentData = this.messageSubject.value;
    const updatedData = currentData.filter(window => window.WindowType !== windowType); 
    this.messageSubject.next(updatedData); 
  }

  private receiveWindowData(event: MessageEvent): void {
    try {
      const data: WindowData = JSON.parse(event.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
}
