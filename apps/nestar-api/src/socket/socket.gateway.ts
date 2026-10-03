import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from "ws"

interface MessagePayload {
  event: string;
  text: string;
}

interface InfoPayload {
  event: string;
  totalClients: number;
}


@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway {
  private logger: Logger = new Logger("SocketEventGateway")
  private summaryClient: number = 0


  @WebSocketServer()
  server!: Server;


  public afterInit(server: Server) {
    this.logger.verbose(`WevSocket Server Initialized && total: [${this.summaryClient}]`)
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.summaryClient++;
    this.logger.verbose(`Connection && total: [${this.summaryClient}]`)

    const infoMsg: InfoPayload = {
      event: "info",
      totalClients: this.summaryClient
    }

    this.emitMessage(infoMsg)

  }

  handleDisconnect(client: WebSocket) {
    this.summaryClient--;
    this.logger.verbose(`DisConnection && total: [${this.summaryClient}]`)

    const infoMsg: InfoPayload = {
      event: "info",
      totalClients: this.summaryClient
    }

    //client chiqib ketgan user boladi

    this.broadcastMessage(client, infoMsg)
  }


  @SubscribeMessage('message')
  public async handleMessage(client: any, payload: string): Promise<void> {
    const newMessage: MessagePayload = {
      event: "message",
      text: payload
    }

    this.logger.verbose(`NEW MESSAGE: ${payload}`)
    this.emitMessage(newMessage)

  }



  private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }


  private emitMessage(message: InfoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }
}
