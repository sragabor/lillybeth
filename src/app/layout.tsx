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
  title: 'Lillybeth® Guesthouses | Villa Lillybeth & Garden Rooms & Lakeside',
  description:
    'Premium guesthouse accommodation at Lake Balaton. Book directly for the best prices. Villa Lillybeth®, Lillybeth® Garden Rooms & Lillybeth® Lakeside.'
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
