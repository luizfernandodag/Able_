import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { RealtimeGateway } from '../realtime.gateway';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HourlyAverage } from '../entity/hourly-average.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class FinnhubService implements OnModuleInit, OnModuleDestroy {
  private ws?: WebSocket;
  private reconnectDelay = 5000;
  private symbolPairs = ['ETHUSDC','ETHUSDT','ETHBTC'];

  constructor(
    private gateway: RealtimeGateway,
    @InjectRepository(HourlyAverage)
    private repo: Repository<HourlyAverage>
  ) {}

  onModuleInit() {
    this.connect();
  }
  onModuleDestroy() {
    this.ws?.close();
  }

  private connect() {
    const token = process.env.FINNHUB_KEY;
    if (!token) {
      console.warn('FINNHUB_KEY missing in env; finnHub connection will not start.');
      return;
    }
    const url = `wss://ws.finnhub.io?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('Connected to Finnhub');
      this.symbolPairs.forEach(s => this.ws?.send(JSON.stringify({ type: 'subscribe', symbol: s })));
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          msg.data.forEach((d: any) => this.handleTrade(d));
        }
      } catch (err) {
        console.error('Invalid message', err);
      }
    });

    this.ws.on('close', () => {
      console.log(`Finnhub ws closed. reconnecting in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    });

    this.ws.on('error', (err) => {
      console.error('Finnhub ws error', err);
      this.ws?.close();
    });
  }

  private async handleTrade(d: any) {
    const symbol = d.s || d.symbol || 'UNKNOWN';
    const price = Number(d.p || d.price || 0);
    const ts = new Date(d.t || Date.now());
    const hourStart = new Date(ts);
    hourStart.setMinutes(0,0,0);
    const hourIso = hourStart.toISOString();

    await this.upsertHourlyAverage(symbol, hourIso, price, 1);
    this.gateway.broadcast({
      type: 'tick',
      symbol,
      price,
      timestamp: ts.toISOString(),
    });
  }

  private async upsertHourlyAverage(pair:string, hourStart:string, incomingAvg:number, incomingCount:number){
    await this.repo.manager.transaction(async (tx) => {
      const existing = await tx.findOne(HourlyAverage, { where: { pair, hourStart } });
      if (!existing) {
        const ent = tx.create(HourlyAverage, { pair, hourStart, avgPrice: incomingAvg, sampleCount: incomingCount });
        await tx.save(ent);
        return;
      }
      const totalCount = existing.sampleCount + incomingCount;
      const combinedAvg = ((existing.avgPrice * existing.sampleCount) + (incomingAvg * incomingCount)) / totalCount;
      existing.avgPrice = combinedAvg;
      existing.sampleCount = totalCount;
      await tx.save(existing);
    });
  }
}
