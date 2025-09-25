
import { Providers } from '@/context/providers';
import { Inter, Oswald, Orbitron } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-heading' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-accent' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          oswald.variable,
          orbitron.variable
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
