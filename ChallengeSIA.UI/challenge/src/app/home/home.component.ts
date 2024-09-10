import { Component, OnInit } from '@angular/core';
import { PositionData, WindowData } from 'src/models/position';
import { WebSocketService } from '../websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  windows: WindowData[] = [];
  private draggingWindow: WindowData | null = null;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private webSocketService: WebSocketService) { }

  ngOnInit(): void {
    this.webSocketService.messages.subscribe((data: WindowData[]) => {
      this.windows = data;
      this.initializeWindows();
    });

    this.openNotepad();
  }

  initializeWindows() {
    this.windows.forEach(windowData => {
      this.addWindow(windowData);
    });
  }

  async openNotepad() {
    const windowData: WindowData = {
      WindowType: "",
      Position: null 
    };
    await this.webSocketService.sendMessage(windowData);
  }

  addWindow(windowData: WindowData) {
    if (!windowData.Position) {
      windowData.Position = { Left: 0, Top: 0, Right: 100, Bottom: 100 };
    }
    this.windows.push(windowData);
  }

  async sendWindowPositionUpdate(window: WindowData) {
    await this.webSocketService.sendMessage(window);  
  }

  onMouseDown(event: MouseEvent, window: WindowData) {
    this.draggingWindow = window;
    this.offsetX = event.clientX - window.Position.Left;
    this.offsetY = event.clientY - window.Position.Top;

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggingWindow) {
      const newLeft = event.clientX - this.offsetX;
      const newTop = event.clientY - this.offsetY;
      const newRight = newLeft + (this.draggingWindow.Position.Right - this.draggingWindow.Position.Left);
      const newBottom = newTop + (this.draggingWindow.Position.Bottom - this.draggingWindow.Position.Top);

      this.draggingWindow.Position = { Left: newLeft, Top: newTop, Right: newRight, Bottom: newBottom };
      
      this.sendWindowPositionUpdate(this.draggingWindow);
    }
  }

  onMouseUp() {
    this.draggingWindow = null;

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }
}
