import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'VedaAI – Assessment Creator',
  description: 'Generate well-structured assessment papers with AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
