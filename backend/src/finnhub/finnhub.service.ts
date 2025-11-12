import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Importado ConfigService
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import WebSocket from 'ws';
import { HourlyAverage } from '../entity/hourly-average.entity';
import { RealtimeGateway } from '../realtime.gateway';

@Injectable()
export class FinnhubService implements OnModuleInit, OnModuleDestroy {
  private ws?: WebSocket;
  private reconnectDelay = 5000;
  private symbolPairs = ['ETHUSDC', 'ETHUSDT', 'ETHBTC'];
  private isMockMode: boolean;
  private mockInterval?: NodeJS.Timeout;

  constructor(
    private gateway: RealtimeGateway,
    @InjectRepository(HourlyAverage)
    private repo: Repository<HourlyAverage>,
    private configService: ConfigService // Injetado ConfigService
  ) {
    // Definindo o modo com base na variável de ambiente (ajuste o nome se necessário)
    this.isMockMode = this.configService.get<string>('USE_MOCK_DATA') === 'true';
  }

  onModuleInit() {
    if (this.isMockMode) {
      console.log('--- MOCK MODE ACTIVE --- Generating test data.');
      this.startMockDataFeed();
    } else {
      console.log('--- REAL MODE ACTIVE --- Connecting to Finnhub API.');
      this.connectToFinnhub();
    }
  }

  onModuleDestroy() {
    this.ws?.close();
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }

  // Lógica para conexão REAL com Finnhub
  private connectToFinnhub() {
    const token = this.configService.get<string>('FINNHUB_KEY');
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
      // Reconnectar apenas se não estiver no modo mock e se a intenção é manter a conexão real
      if (!this.isMockMode) { 
        setTimeout(() => this.connectToFinnhub(), this.reconnectDelay);
      }
    });

    this.ws.on('error', (err) => {
      console.error('Finnhub ws error', err);
      this.ws?.close();
    });
  }

  // Lógica para geração de dados MOCK
  private startMockDataFeed() {
    // Emite dados de teste aleatórios a cada 1.5 segundos
    this.mockInterval = setInterval(() => {
      const mockSymbol = this.symbolPairs[Math.floor(Math.random() * this.symbolPairs.length)];
      const mockPrice = (Math.random() * 100) + 2000; // Preço aleatório
      
      const mockTradeData = {
        s: mockSymbol, 
        p: parseFloat(mockPrice.toFixed(2)), 
        t: Date.now() / 1000, // Timestamp em segundos (formato Finnhub)
        v: Math.random() * 5 
      };
      
      // Chama o mesmo handler usado pelos dados reais para processar e transmitir
      this.handleTrade(mockTradeData); 

    }, 1500); 
  }

  // O restante do código (handleTrade e upsertHourlyAverage) permanece o mesmo, 
  // pois a lógica de processamento e DB é a mesma para dados reais e mockados.

  private async handleTrade(d: any) {
    const symbol = d.s || d.symbol || 'UNKNOWN';
    const price = Number(d.p || d.price || 0);
    const ts = new Date(d.t * 1000 || Date.now()); // Converte de segundos para milissegundos, se necessário
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
      // ... (sua lógica de upsert existente) ...
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
