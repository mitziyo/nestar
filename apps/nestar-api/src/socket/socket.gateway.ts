import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from "ws"
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url'

interface MessagePayload {
  event: string;
  text: string;
  memberData: Member | null // xabar yozgan a'zo; token bo'lmasa null (mehmon)
}

interface InfoPayload {
  event: string;
  totalClients: number;
  memberData: Member | null; // kirgan/chiqqan a'zo ma'lumoti
  action: string // 'joined' yoki 'left' — frontend kim kirib/chiqqanini ko'rsatishi uchun
}


@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway {
  private logger: Logger = new Logger("SocketEventGateway")
  private summaryClient: number = 0

  // har bir socket ulanishini uning a'zosiga bog'laydi — keyingi xabar/uzilishda tokenni qayta tekshirmaslik uchun
  private clientsAuthMap = new Map<WebSocket, Member | null>()
  // oxirgi xabarlar xotirada saqlanadi — yangi ulangan client chat tarixini ko'rishi uchun
  private messagesList: MessagePayload[] = []


  constructor(private authService: AuthService) { }

  @WebSocketServer()
  server!: Server;


  public afterInit(server: Server) {
    this.logger.verbose(`WevSocket Server Initialized && total: [${this.summaryClient}]`)
  }


  // ulanish URL'idagi ?token=... ni olib JWT'ni tekshiradi; token yo'q/yaroqsiz bo'lsa null — mehmon sifatida qabul qilinadi
  private async retrieveAuth(req: any): Promise<Member | null> {
    try {
      const parseUrl = url.parse(req.url, true)
      const { token } = parseUrl.query

      return await this.authService.verifyToken(token as string)
    } catch (err) {
      return null
    }
  }


  // req — massiv emas, bitta HTTP upgrade so'rovi (IncomingMessage); undan req.url o'qiladi
  public async handleConnection(client: WebSocket, req: any) {

    const authMember = await this.retrieveAuth(req)

    //key object boladi ==? Map complex data type uchun
    this.clientsAuthMap.set(client, authMember)
    const clientNick: string = authMember?.memberNick ?? "Guest"

    this.summaryClient++;

    this.logger.verbose(`Connection [${clientNick}]&& total: [${this.summaryClient}]`)

    const infoMsg: InfoPayload = {
      event: "info",
      totalClients: this.summaryClient,
      memberData: authMember,
      action: 'joined'
    }

    this.emitMessage(infoMsg)

    // faqat yangi ulangan client'ga — saqlangan oxirgi xabarlar tarixini yuboradi
    client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }))

  }

  public async handleDisconnect(client: WebSocket) {

    // chiqib ketayotgan a'zoni Map'dan olib, keyin o'chiradi — xotira sizib ketmasligi uchun
    const authMember = this.clientsAuthMap.get(client)

    this.clientsAuthMap.delete(client)

    const clientNick: string = authMember?.memberNick ?? "Guest"

    this.summaryClient--;
    this.logger.verbose(`DisConnection [${clientNick}] && total: [${this.summaryClient}]`)

    const infoMsg: InfoPayload = {
      event: "info",
      totalClients: this.summaryClient,
      memberData: authMember ?? null,
      action: 'left'
    }

    //client chiqib ketgan user boladi

    this.broadcastMessage(client, infoMsg)
  }


  @SubscribeMessage('message')
  public async handleMessage(client: any, payload: string): Promise<void> {

    // xabar egasini ulanish paytida saqlangan Map'dan oladi — har xabarda JWT tekshirilmaydi
    const authMember = this.clientsAuthMap.get(client)

    const newMessage: MessagePayload = {
      event: "message",
      text: payload,
      memberData: authMember ?? null
    }

    const clientNick: string = authMember?.memberNick ?? "Guest"

    this.logger.verbose(`NEW MESSAGE [${clientNick}]: ${payload}`)

    // tarixda faqat oxirgi 5 ta xabar qoladi — eskilari boshidan kesiladi, xotira cheksiz o'smasligi uchun
    this.messagesList.push(newMessage)
    if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5)


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


/*
Client faqat oziga  ==> client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }))

broadcast clientdan tashqari hammaga ==>   this.broadcastMessage(client, infoMsg)

Emit serverdagi barcha clientlarga ==>    this.emitMessage(newMessage)
*/
