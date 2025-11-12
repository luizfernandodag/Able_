import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable } from '@nestjs/common';

// @WebSocketGateway({ port: +process.env.WS_PORT! || 4000, path: '/ws' })
@WebSocketGateway({
    path: '/ws', 
    cors: { // Adicione CORS para permitir a conexão do frontend (localhost:5173)
        origin: 'http://localhost:5173',
        credentials: true
    }
 })
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

    handleConnection(client: WebSocket) { // Usando o tipo WebSocket do 'ws'
    console.log('Client connected');
  }
  handleDisconnect(client: WebSocket) { // Usando o tipo WebSocket do 'ws'
    console.log('Client disconnected');
  }

  // handleConnection(client: any) {
  //   console.log('Client connected');
  // }
  // handleDisconnect(client: any) {
  //   console.log('Client disconnected');
  // }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.server.clients.forEach((c: any) => {
      if (c.readyState === c.OPEN) c.send(message);
    });
  }
}
