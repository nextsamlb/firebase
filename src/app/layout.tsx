import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/context/providers'

export const metadata: Metadata = {
  title: 'PIFA League',
  description: 'The official hub for the PIFA football league.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Oswald:wght@400;500;700&family=Orbitron:wght@500;700&display=swap"
          rel="stylesheet"
        />
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
