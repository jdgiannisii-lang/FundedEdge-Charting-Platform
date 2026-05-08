export interface PropFirm {
  id: string;
  slug: string;
  name: string;
}

export interface PropAccount {
  id: string;
  firmId: string;
  userId: string;
  accountSize: number;
  phase: 'evaluation' | 'funded';
  startDate: string;
}

export interface TradeSession {
  id: string;
  accountId: string;
  date: string;
  realizedPnl: number;
  openPnl: number;
}
