import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type Tick = { symbol: string; price: number; timestamp: string };

export default function App() {
  const [connected, setConnected] = useState(false);
  const [ticks, setTicks] = useState<Record<string, Tick[]>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'tick') {
          setTicks(prev => {
            const arr = prev[msg.symbol] ? [...prev[msg.symbol]] : [];
            arr.push({ symbol: msg.symbol, price: msg.price, timestamp: msg.timestamp });
            return { ...prev, [msg.symbol]: arr.slice(-100) };
          });
        }
      } catch (e) { console.error(e); }
    };

    return () => ws.close();
  }, []);

  const renderChart = (symbol: string) => {
    const data = (ticks[symbol] || []).map(t => ({ time: new Date(t.timestamp).toLocaleTimeString(), price: t.price }));
    return (
      <div key={symbol} style={{ width: 500, margin: 20 }}>
        <h3>{symbol} — {data.length ? data[data.length-1].price : '—'}</h3>
        <LineChart width={480} height={240} data={data}>
          <CartesianGrid />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" dot={false} />
        </LineChart>
      </div>
    );
  };

  const symbols = Object.keys(ticks);
  return (
    <div style={{ padding: 20 }}>
      <h1>Realtime Crypto Dashboard</h1>
      <div>Connection: {connected ? 'connected' : 'disconnected'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {symbols.length ? symbols.map(renderChart) : <div>No data yet — waiting ticks...</div>}
      </div>
    </div>
  );
}
