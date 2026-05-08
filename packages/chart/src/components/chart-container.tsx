import * as React from 'react';

export interface ChartContainerProps {
  symbol: string;
  interval?: string;
  className?: string;
}

export function ChartContainer({ symbol, interval = '1D', className }: ChartContainerProps) {
  return (
    <div className={className} data-symbol={symbol} data-interval={interval}>
      <p>Chart placeholder — TradingView integration in task 08</p>
    </div>
  );
}
