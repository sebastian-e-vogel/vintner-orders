import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vintner Orders',
  description: 'Phone-order desk for a fictional wine distributor.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:outline-2 focus:outline-ring"
        >
          Skip to content
        </a>
        <Header />
        <main
          id="main-content"
          className="mx-auto max-w-content px-8 py-8 has-[[data-wide]]:max-w-[90rem]"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
