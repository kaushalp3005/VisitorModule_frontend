import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { VisitorProvider } from '@/lib/visitor-store';
import { AuthProvider } from '@/lib/auth-store';

export const metadata: Metadata = {
  title: 'Smart Visitor Pass',
  description: 'Visitor approval and check-in system',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <VisitorProvider>
            {children}
          </VisitorProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
