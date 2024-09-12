import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Konva from 'konva'; // Importa Konva
import { WebSocketService } from '../websocket.service';

interface PositionData {
  Left: number;
  Top: number;
  Right: number;
  Bottom: number;
}

interface WindowData {
  WindowType: string;
  Position: PositionData;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('container', { static: true }) container!: ElementRef;
  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private transformer!: Konva.Transformer;
  private selectedShape: Konva.Shape | null = null;
  private shapes: Konva.Shape[] = []; // Para almacenar las formas
  windows: WindowData[] = []; // Para almacenar la información de ventanas
  shapesCreated: boolean = false;
  constructor(private webSocketService: WebSocketService) { }
  
  ngOnInit(): void {
    this.webSocketService.messages.subscribe((data: WindowData[]) => {
      this.windows = data.filter(p => p.Position != null);
      console.log("hola", this.windows)
      this.updateShapes();
    }); 
  }

  ngAfterViewInit(): void {
    this.initializeStage();
    this.openNotepad(); // Crear rectángulos iniciales
    
  }

  initializeStage() {
    const containerElement = this.container.nativeElement;

    this.stage = new Konva.Stage({
      container: containerElement,
      width: containerElement.clientWidth,
      height: containerElement.clientHeight
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.transformer = new Konva.Transformer({
      resizeEnabled: true,
      rotateEnabled: false, // Desactiva la rotación si no la necesitas
      borderEnabled: true,
      anchorSize: 10,
      borderStrokeWidth: 1,
      borderStroke: 'black'
    });

    this.layer.add(this.transformer);

    // Agregar manejadores de eventos
    this.stage.on('click', this.onStageClick.bind(this));
    this.stage.on('dragstart', this.onDragStart.bind(this));
    this.stage.on('dragend', this.onDragEnd.bind(this));
  }

  async openNotepad() {
    this.shapesCreated = false;
    // Crear dos rectángulos de ejemplo con datos de windowsData
    const windowData: WindowData = {
      WindowType: "",
      Position: null 
    };
    await this.webSocketService.sendMessage(windowData);

  }
  removeOutdatedShapes() {
    // Obtén los tipos de ventanas actuales
    const currentWindowTypes = this.windows.map(window => window.WindowType);
    
    // Elimina shapes que ya no están en la lista de windows
    this.shapes.forEach(shape => {
      if (!currentWindowTypes.includes(shape.name())) {
        this.removeShape(shape);
      }
    });
  }
  updateShapes(): void {
    if (!this.shapesCreated) { // Verifica si no se han creado las shapes
      this.createShapesFromWindows(); // Crea las shapes solo una vez
      this.shapesCreated = this.windows.length == 2 ? true: false; // Marca que las shapes ya han sido creadas
    }else {
      // Si ya se han creado, actualiza su posición
      this.updateShapePositions();
      this.removeOutdatedShapes();
    } 

  }

  createShapesFromWindows() {
    this.layer?.removeChildren(); // Limpiar la capa antes de añadir nuevas formas
    this.shapes = [];

    this.windows.forEach(windowData => {
      if (windowData.Position) {
        const position = windowData.Position;
        const shape = this.createRectangle(
          position.Left,
          position.Top,
          position.Right - position.Left,
          position.Bottom - position.Top,
          'lightblue',
          windowData.WindowType
        );
        this.layer?.add(shape);
        this.shapes.push(shape);

        shape.on('click', () => this.selectShape(shape));
        shape.on('dragmove', () => this.checkOverlapAndBounds());
        shape.on('dragend', () => this.sendUpdatedPositions());
        shape.on('transform', () => {this.checkOverlapAndBounds(); this.onShapeTransform(shape, windowData.WindowType)});
        shape.on('dblclick', () => this.removeNotepad(shape));
      }
    });

    this.layer?.add(this.transformer);
    this.layer?.batchDraw(); // Asegúrate de redibujar la capa después de añadir las formas
  }

  updateShapePositions() {
    this.windows.forEach(windowData => {
      const shape = this.shapes.filter(x=> x.name() == windowData.WindowType)[0]; // Obtiene la forma asociada al WindowType
      if (shape && windowData.Position) {
        const position = windowData.Position;
        // Actualiza la posición de la forma existente
        shape.x(position.Left);
        shape.y(position.Top);
        shape.width(position.Right - position.Left);
        shape.height(position.Bottom - position.Top);
      }
    });
    
    this.layer?.batchDraw(); // Redibuja la capa después de actualizar las posiciones

    this.checkOverlapAndBounds();
  }
  removeNotepad(shape: Konva.Shape) {
    const updatedWindowData: WindowData = {
      WindowType: shape.name(),
      Position: null
    };
    this.closeWindow(updatedWindowData)
    this.removeShape(shape)
  }

  removeShape(shape: Konva.Shape) {
    if (shape) {
      shape.off('click'); // Elimina los manejadores de eventos para evitar problemas
      shape.destroy(); 
      this.shapes = this.shapes.filter(s => s !== shape); // Actualiza el array de shapes
      this.layer?.batchDraw(); // Redibuja la capa
    }
  }
  checkOverlapAndBounds() {
    this.checkOverlap();
    this.checkBounds();
  }

  checkOverlap() {
    const shapes = this.shapes;
    for (let i = 0; i < shapes.length; i++) {
      const shape1 = shapes[i];
      const rect1 = shape1.getClientRect();
      for (let j = i + 1; j < shapes.length; j++) {
        const shape2 = shapes[j];
        const rect2 = shape2.getClientRect();
        if (this.isOverlapping(rect1, rect2)) {
          this.adjustPosition(shape1, shape2);
        }
      }
    }
    this.layer?.batchDraw();
  }

  isOverlapping(rect1: Konva.RectConfig, rect2: Konva.RectConfig): boolean {
    return !(rect1.x > rect2.x + rect2.width ||
             rect1.x + rect1.width < rect2.x ||
             rect1.y > rect2.y + rect2.height ||
             rect1.y + rect1.height < rect2.y);
  }

  adjustPosition(shape1: Konva.Shape, shape2: Konva.Shape) {
    const rect1 = shape1.getClientRect();
    const rect2 = shape2.getClientRect();
    
    // Ajustar la posición del shape1 para evitar la superposición con shape2
    let newX = rect1.x;
    let newY = rect1.y;

    // Recalcular la posición para evitar la superposición
    if (rect1.x < rect2.x) {
      newX = rect2.x - rect1.width - 10; // Ajustar la posición horizontal
    } else {
      newX = rect2.x + rect2.width + 10; // Ajustar la posición horizontal
    }

    if (rect1.y < rect2.y) {
      newY = rect2.y - rect1.height - 10; // Ajustar la posición vertical
    } else {
      newY = rect2.y + rect2.height + 10; // Ajustar la posición vertical
    }

    shape1.position({ x: newX, y: newY });
  }

  checkBounds() {
    const stageWidth = this.stage?.width();
    const stageHeight = this.stage?.height();
    this.shapes.forEach(shape => {
      const rect = shape.getClientRect();
      
      // Asegurarse de que el rectángulo esté completamente dentro del contenedor
      if (rect.x < 0) {
        shape.x(0);
      }
      if (rect.y < 0) {
        shape.y(0);
      }
      if (rect.x + rect.width > stageWidth) {
        shape.x(stageWidth - rect.width);
      }
      if (rect.y + rect.height > stageHeight) {
        shape.y(stageHeight - rect.height);
      }
      shape.position({ x: shape.x(), y: shape.y() }); // Actualiza la posición
    });
    this.layer?.batchDraw(); // Redibuja la capa

    // Enviar posiciones actualizadas a través de WebSocket
    
  }

  selectShape(shape: Konva.Shape) {
    if (this.selectedShape) {
      this.transformer.nodes([]); // Desvincular el transformador de la forma previamente seleccionada
    }

    this.transformer.nodes([shape]);
    this.selectedShape = shape;
    this.layer.batchDraw();
  }

  onStageClick(event: Konva.KonvaEventObject<MouseEvent>) {
    const shape = event.target as Konva.Shape;
    if (shape instanceof Konva.Rect) {
      this.selectShape(shape);
    } else {
      this.transformer.nodes([]); // Desvincular el transformador si se hace clic en un área vacía
      this.selectedShape = null;
    }
  }
  onShapeTransform(shape: Konva.Rect, windowType: string) {
    // Captura las nuevas dimensiones y posición teniendo en cuenta la escala
    const scaleX = shape.scaleX();
    const scaleY = shape.scaleY();
  
    const updatedPosition = {
      Left: shape.x(),
      Top: shape.y(),
      Right: shape.x() + shape.width() * scaleX, // Ajuste con la escala X
      Bottom: shape.y() + shape.height() * scaleY, // Ajuste con la escala Y
    };
  
    // Resetear la escala para evitar problemas acumulativos
    shape.width(shape.width() * scaleX);
    shape.height(shape.height() * scaleY);
    shape.scaleX(1);
    shape.scaleY(1);
  
    // Envía la información actualizada del tamaño y posición al servidor
    const updatedWindowData: WindowData = {
      WindowType: windowType,
      Position: updatedPosition
    };
  
    this.sendWindowPositionUpdate(updatedWindowData); // Envía los datos por WebSocket
  
    // Actualiza la capa para reflejar los cambios
    this.layer?.batchDraw();
  }
  
  onDragStart(event: Konva.KonvaEventObject<DragEvent>) {
    // Aquí puedes manejar eventos adicionales al comenzar a arrastrar si es necesario
  }

  onDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    // Aquí puedes manejar eventos adicionales al terminar de arrastrar si es necesario
    this.layer.batchDraw(); // Redibuja la capa para asegurarse de que el estado del transformador esté actualizado
  }

  onShapeChange() {   
    this.sendUpdatedPositions();
  }

  sendUpdatedPositions() {
    const windowData: WindowData[] = this.shapes.map(shape => ({
      WindowType: shape.name(), // Usa un tipo adecuado
      Position: {
        Left: shape.x(),
        Top: shape.y(),
        Right: shape.x() + shape.width(),
        Bottom: shape.y() + shape.height()
      }
    }));

    windowData.forEach(element => {
      this.sendWindowPositionUpdate(element);
    });
  }

  async sendWindowPositionUpdate(window: WindowData) {
    const roundedPosition = {
      Left: this.roundValue(window.Position.Left),
      Top: this.roundValue(window.Position.Top),
      Right: this.roundValue(window.Position.Right),
      Bottom: this.roundValue(window.Position.Bottom)
    };
  
    // Crear una copia del objeto window con la posición redondeada
    const updatedWindow: WindowData = {
      WindowType: window.WindowType,
      Position: roundedPosition
    };

    // Enviar el mensaje con la posición redondeada
    await this.webSocketService.sendMessage(updatedWindow);
  }
  roundValue(value: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  createRectangle(x: number, y: number, width: number, height: number, color: string, id: string): Konva.Rect {
    const rect = new Konva.Rect({
      x: x,
      y: y,
      width: width,
      height: height,
      fill: color,
      stroke: 'black',
      strokeWidth: 2,
      draggable: true, // Hacer el rectángulo arrastrable,
      name: id // Asignar un nombre (o id) único a la forma
    });

    return rect;
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
}
