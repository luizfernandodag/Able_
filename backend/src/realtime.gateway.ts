import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ port: +process.env.WS_PORT || 4000, path: '/ws' })
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: any) {
    console.log('Client connected');
  }
  handleDisconnect(client: any) {
    console.log('Client disconnected');
  }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.server.clients.forEach((c: any) => {
      if (c.readyState === c.OPEN) c.send(message);
    });
  }
}
