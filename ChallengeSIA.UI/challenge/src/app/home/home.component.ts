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
  private shapes: Konva.Shape[] = []; 
  windows: WindowData[] = []; 
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
    this.openNotepad(); 
    
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
      rotateEnabled: false, 
      borderEnabled: true,
      anchorSize: 10,
      borderStrokeWidth: 1,
      borderStroke: 'black'
    });

    this.layer.add(this.transformer);

    this.stage.on('click', this.onStageClick.bind(this));
    this.stage.on('dragstart', this.onDragStart.bind(this));
    this.stage.on('dragend', this.onDragEnd.bind(this));
  }

  async openNotepad() {
    this.shapesCreated = false;
    const windowData: WindowData = {
      WindowType: "",
      Position: null 
    };
    await this.webSocketService.sendMessage(windowData);

  }
  removeOutdatedShapes() {
    const currentWindowTypes = this.windows.map(window => window.WindowType);
    
    this.shapes.forEach(shape => {
      if (!currentWindowTypes.includes(shape.name())) {
        this.removeShape(shape);
      }
    });
  }
  updateShapes(): void {
    if (!this.shapesCreated) { 
      this.createShapesFromWindows(); 
      this.shapesCreated = this.windows.length == 2 ? true: false; 
    }else {
      this.updateShapePositions();
      this.removeOutdatedShapes();
    } 

  }

  createShapesFromWindows() {
    this.layer?.removeChildren(); 
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
    this.layer?.batchDraw();
  }

  updateShapePositions() {
    this.windows.forEach(windowData => {
      const shape = this.shapes.filter(x=> x.name() == windowData.WindowType)[0]; 
      if (shape && windowData.Position) {
        const position = windowData.Position;
        shape.x(position.Left);
        shape.y(position.Top);
        shape.width(position.Right - position.Left);
        shape.height(position.Bottom - position.Top);
      }
    });
    
    this.layer?.batchDraw(); 

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
      shape.off('click');
      shape.destroy(); 
      this.shapes = this.shapes.filter(s => s !== shape); 
      this.layer?.batchDraw();
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
    
    let newX = rect1.x;
    let newY = rect1.y;

    if (rect1.x < rect2.x) {
      newX = rect2.x - rect1.width - 10; 
    } else {
      newX = rect2.x + rect2.width + 10; 
    }

    if (rect1.y < rect2.y) {
      newY = rect2.y - rect1.height - 10; 
    } else {
      newY = rect2.y + rect2.height + 10; 
    }

    shape1.position({ x: newX, y: newY });
    this.onShapeChange();
  }

  checkBounds() {
    const stageWidth = this.stage?.width();
    const stageHeight = this.stage?.height();
    this.shapes.forEach(shape => {
      const rect = shape.getClientRect();
      
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
      shape.position({ x: shape.x(), y: shape.y() }); 
    });
    this.layer?.batchDraw(); 

    
  }

  selectShape(shape: Konva.Shape) {
    if (this.selectedShape) {
      this.transformer.nodes([]); 
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
      this.transformer.nodes([]); 
      this.selectedShape = null;
    }
  }
  onShapeTransform(shape: Konva.Rect, windowType: string) {
    const scaleX = shape.scaleX();
    const scaleY = shape.scaleY();
  
    const updatedPosition = {
      Left: shape.x(),
      Top: shape.y(),
      Right: shape.x() + shape.width() * scaleX, 
      Bottom: shape.y() + shape.height() * scaleY, 
    };
  
    shape.width(shape.width() * scaleX);
    shape.height(shape.height() * scaleY);
    shape.scaleX(1);
    shape.scaleY(1);
  
    const updatedWindowData: WindowData = {
      WindowType: windowType,
      Position: updatedPosition
    };
  
    this.sendWindowPositionUpdate(updatedWindowData); 
  
    this.layer?.batchDraw();
  }
  
  onDragStart(event: Konva.KonvaEventObject<DragEvent>) {
  }

  onDragEnd(event: Konva.KonvaEventObject<DragEvent>) {
    this.layer.batchDraw(); 
  }

  onShapeChange() {   
    this.sendUpdatedPositions();
  }

  sendUpdatedPositions() {
    const windowData: WindowData[] = this.shapes.map(shape => ({
      WindowType: shape.name(), 
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
  
    const updatedWindow: WindowData = {
      WindowType: window.WindowType,
      Position: roundedPosition
    };

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
      draggable: true, 
      name: id 
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
