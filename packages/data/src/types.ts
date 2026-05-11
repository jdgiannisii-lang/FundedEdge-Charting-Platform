export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Symbol {
  id: string;
  displayName: string;
  exchange: string;
  tickSize: number;
  contractSize: number;
  currency: string;
}
