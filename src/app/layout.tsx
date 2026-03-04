import type { Metadata } from 'next'
import { Birthstone, Inter } from 'next/font/google'
import './globals.css'

const birthstone = Birthstone({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-birthstone',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})


export const metadata: Metadata = {
  title: {
    default: 'Lillybeth® Guesthouses | Lake Balaton',
    template: '%s | Lillybeth®',
  },
  description:
    'Book your stay at Lillybeth® Guesthouses on Lake Balaton. Cozy rooms, stunning views, and authentic Hungarian hospitality. Best price guaranteed.',
  metadataBase: new URL('https://lillybeth.hu'),
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${birthstone.variable} ${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
