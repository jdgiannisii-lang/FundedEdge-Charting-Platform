import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FundedEdge — Stay Funded',
  description:
    'The trading cockpit for ICT futures traders running prop firm capital. Stay funded with real-time rule alerts, pre-trade checklists, and economic calendar integration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
