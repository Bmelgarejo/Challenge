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

  constructor(private webSocketService: WebSocketService) { }

  ngOnInit(): void {
    this.webSocketService.messages.subscribe((data: WindowData[]) => {
      this.windows = data;
    });
  }
  async openNotepad() {
    const windowData: WindowData = {
      WindowType: "",
      Position: null 
    };
    await this.webSocketService.sendMessage(windowData);
  }

  async updateWindowPosition() {
    const positionData: PositionData = {
      Left: 100,
      Top: 100,
      Right: 500,
      Bottom: 400
    };
    
   this.windows.forEach(windType => {
    windType.Position = positionData;
    this.webSocketService.sendMessage(windType);    
   })

  }
}
