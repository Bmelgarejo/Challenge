import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PositionData, WindowData } from 'src/models/position';
import { WebSocketService } from '../websocket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @ViewChild('container', { static: true }) container!: ElementRef;

  windows: WindowData[] = [];
  private draggingWindow: WindowData | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private previousPositions: Map<WindowData, PositionData> = new Map(); 

  constructor(private webSocketService: WebSocketService) { }

  ngOnInit(): void {
    this.openNotepad();
    this.webSocketService.messages.subscribe((data: WindowData[]) => {
      this.windows = data.filter(p => p.Position != null);
      this.initializeWindows();
    }); 
  }

  initializeWindows() {
    this.checkAndAdjustOverlap(); 
  }

  async openNotepad() {
    const windowData: WindowData = {
      WindowType: "",
      Position: null 
    };
    await this.webSocketService.sendMessage(windowData);
  }

  async closeWindow(windowToClose: WindowData) {
    this.windows = this.windows.filter(window => window !== windowToClose);
    const windowData: WindowData = {
      WindowType: windowToClose.WindowType,
      Position: null 
    };
    this.webSocketService.removeWindow(windowToClose.WindowType);
    await this.webSocketService.sendMessage(windowData);
  }

  async sendWindowPositionUpdate(window: WindowData) {
    await this.webSocketService.sendMessage(window);  
  }

  onMouseDown(event: MouseEvent, window: WindowData) {
    this.draggingWindow = window;
    this.offsetX = event.clientX - window.Position.Left;
    this.offsetY = event.clientY - window.Position.Top;

    this.previousPositions.set(window, { ...window.Position });

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggingWindow) {
      const containerElement = this.container.nativeElement;
      const containerRect = containerElement.getBoundingClientRect();

      const newLeft = Math.max(0, Math.min(event.clientX - this.offsetX, containerRect.width - (this.draggingWindow.Position.Right - this.draggingWindow.Position.Left)));
      const newTop = Math.max(0, Math.min(event.clientY - this.offsetY, containerRect.height - (this.draggingWindow.Position.Bottom - this.draggingWindow.Position.Top)));
      const newRight = newLeft + (this.draggingWindow.Position.Right - this.draggingWindow.Position.Left);
      const newBottom = newTop + (this.draggingWindow.Position.Bottom - this.draggingWindow.Position.Top);

      this.draggingWindow.Position = { Left: newLeft, Top: newTop, Right: newRight, Bottom: newBottom };

      if (this.checkAndAdjustOverlap()) {
        const previousPosition = this.previousPositions.get(this.draggingWindow);
        if (previousPosition) {
          this.draggingWindow.Position = previousPosition;
        }
      } else {
        this.sendWindowPositionUpdate(this.draggingWindow);
      }
    }
  }

  onMouseUp() {
    this.draggingWindow = null;

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  checkAndAdjustOverlap(): boolean {
    let adjusted = false;
    const containerElement = this.container.nativeElement;
    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;

    this.windows.forEach(w1 => {
      this.windows.forEach(w2 => {
        if (w1 !== w2 && this.isOverlapping(w1, w2)) {
          adjusted = true;

          this.adjustWindowPosition(w1, w2);

          if (w1.Position.Left < 0) w1.Position.Left = 0;
          if (w1.Position.Top < 0) w1.Position.Top = 0;
          if (w1.Position.Right > containerWidth) w1.Position.Right = containerWidth;
          if (w1.Position.Bottom > containerHeight) w1.Position.Bottom = containerHeight;

          if (w1.Position.Right <= w1.Position.Left) w1.Position.Right = w1.Position.Left + 200;
          if (w1.Position.Bottom <= w1.Position.Top) w1.Position.Bottom = w1.Position.Top + 200;

          this.sendWindowPositionUpdate(w1);
        }
      });
    });

    return adjusted;
  }

  adjustWindowPosition(w1: WindowData, w2: WindowData) {
    const w1Width = w1.Position.Right - w1.Position.Left;
    const w1Height = w1.Position.Bottom - w1.Position.Top;

    if (w1.Position.Left < w2.Position.Left) {
      w1.Position.Left = w2.Position.Right + 10; 
    } else {
      w1.Position.Left = w2.Position.Left - (w1Width + 10); 
    }

    w1.Position.Top = Math.max(0, Math.min(w1.Position.Top, w2.Position.Bottom + 10)); 
    w1.Position.Right = w1.Position.Left + w1Width;
    w1.Position.Bottom = w1.Position.Top + w1Height;
  }

  isOverlapping(w1: WindowData, w2: WindowData): boolean {
    return !(w1.Position.Left > w2.Position.Right ||
             w1.Position.Right < w2.Position.Left ||
             w1.Position.Top > w2.Position.Bottom ||
             w1.Position.Bottom < w2.Position.Top);
  }
}
