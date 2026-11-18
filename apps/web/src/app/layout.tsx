import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vintner Orders',
  description: 'Phone-order desk for a fictional wine distributor.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
