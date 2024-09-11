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
  private previousPositions: Map<WindowData, PositionData> = new Map(); // Para guardar posiciones anteriores

  constructor(private webSocketService: WebSocketService) { }

  ngOnInit(): void {
    this.openNotepad();
    this.webSocketService.messages.subscribe((data: WindowData[]) => {
      this.windows = data;
      this.initializeWindows();
    });

 
  }

  initializeWindows() {
    this.windows.forEach(windowData => {
      this.addWindow(windowData);
    });
    this.checkAndAdjustOverlap(); // Ajustar las ventanas para evitar superposición inicial
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
      windowData.Position = { Left: 0, Top: 0, Right: 200, Bottom: 200 };
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

    // Guardar la posición anterior antes de mover
    this.previousPositions.set(window, { ...window.Position });

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggingWindow) {
      const containerElement = this.container.nativeElement;
      const containerRect = containerElement.getBoundingClientRect();

      // Calcular la nueva posición
      const newLeft = Math.max(0, Math.min(event.clientX - this.offsetX, containerRect.width - (this.draggingWindow.Position.Right - this.draggingWindow.Position.Left)));
      const newTop = Math.max(0, Math.min(event.clientY - this.offsetY, containerRect.height - (this.draggingWindow.Position.Bottom - this.draggingWindow.Position.Top)));
      const newRight = newLeft + (this.draggingWindow.Position.Right - this.draggingWindow.Position.Left);
      const newBottom = newTop + (this.draggingWindow.Position.Bottom - this.draggingWindow.Position.Top);

      // Ajustar la ventana actual
      this.draggingWindow.Position = { Left: newLeft, Top: newTop, Right: newRight, Bottom: newBottom };

      // Verificar y ajustar la superposición
      if (this.checkAndAdjustOverlap()) {
        // Si hubo ajuste por superposición, revertir a la posición anterior
        const previousPosition = this.previousPositions.get(this.draggingWindow);
        if (previousPosition) {
          this.draggingWindow.Position = previousPosition;
        }
      } else {
        // Envía la actualización de la posición si no hay superposición
        this.sendWindowPositionUpdate(this.draggingWindow);
      }
    }
  }

  onMouseUp() {
    this.draggingWindow = null;

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  // Método para verificar y ajustar la superposición de ventanas
  checkAndAdjustOverlap(): boolean {
    let adjusted = false;
    const containerElement = this.container.nativeElement;
    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;

    this.windows.forEach(w1 => {
      this.windows.forEach(w2 => {
        if (w1 !== w2 && this.isOverlapping(w1, w2)) {
          adjusted = true;

          // Ajuste para evitar superposición
          this.adjustWindowPosition(w1, w2);

          // Asegurarse de que la ventana esté dentro del contenedor
          if (w1.Position.Left < 0) w1.Position.Left = 0;
          if (w1.Position.Top < 0) w1.Position.Top = 0;
          if (w1.Position.Right > containerWidth) w1.Position.Right = containerWidth;
          if (w1.Position.Bottom > containerHeight) w1.Position.Bottom = containerHeight;

          // Asegura que las dimensiones de la ventana sean válidas
          if (w1.Position.Right <= w1.Position.Left) w1.Position.Right = w1.Position.Left + 200;
          if (w1.Position.Bottom <= w1.Position.Top) w1.Position.Bottom = w1.Position.Top + 200;

          // Enviar la actualización de la posición después del ajuste
          this.sendWindowPositionUpdate(w1);
        }
      });
    });

    return adjusted;
  }

  // Método para ajustar la posición de una ventana para evitar superposición con otra
  adjustWindowPosition(w1: WindowData, w2: WindowData) {
    const w1Width = w1.Position.Right - w1.Position.Left;
    const w1Height = w1.Position.Bottom - w1.Position.Top;

    // Desplazar w1 a la derecha o izquierda para evitar superposición
    if (w1.Position.Left < w2.Position.Left) {
      w1.Position.Left = w2.Position.Right + 10; // Espacio de 10px entre ventanas
    } else {
      w1.Position.Left = w2.Position.Left - (w1Width + 10); // Espacio de 10px entre ventanas
    }

    w1.Position.Top = Math.max(0, Math.min(w1.Position.Top, w2.Position.Bottom + 10)); // Asegurar que no se pase del límite superior
    w1.Position.Right = w1.Position.Left + w1Width;
    w1.Position.Bottom = w1.Position.Top + w1Height;
  }

  // Método para verificar si dos ventanas se solapan
  isOverlapping(w1: WindowData, w2: WindowData): boolean {
    return !(w1.Position.Left > w2.Position.Right ||
             w1.Position.Right < w2.Position.Left ||
             w1.Position.Top > w2.Position.Bottom ||
             w1.Position.Bottom < w2.Position.Top);
  }
}
