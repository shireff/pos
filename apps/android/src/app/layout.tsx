import type { Metadata } from 'next';
import './globals.css';
import '@packages/ui-components/src/styles/index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Smart Retail OS',
  description: 'Enterprise point-of-sale and inventory management — Android',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
