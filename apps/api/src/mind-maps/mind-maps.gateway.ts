import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { MindMap } from '@a7t/api';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'mind-maps' })
export class MindMapsGateway {
  @WebSocketServer()
  private server?: Server;

  @SubscribeMessage('joinMap')
  joinMap(
    @MessageBody() mindMapId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    void socket.join(this.roomName(mindMapId));
    return { joined: mindMapId };
  }

  broadcastMap(map: MindMap) {
    this.server?.to(this.roomName(map.id)).emit('mapUpdated', map);
  }

  private roomName(mindMapId: string) {
    return `map:${mindMapId}`;
  }
}