import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Retail OS — API',
  description: 'Smart Retail OS Backend API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
