// src/app/layout.tsx
// Layout racine — AuthProvider, Navbar, Footer

import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/app/hooks/useAuth'
import Navbar from '@/app/components/layout/Navbar'
//import Footer from '@/app/components/layout/Footer'
export const metadata: Metadata = {
  title: {
    default:  'BornQueens — Histoire & Tresses Africaines',
    template: '%s — BornQueens',
  },
  description: 'BornQueens célèbre l\'art, l\'histoire et la symbolique des tresses africaines à travers la photographie artistique.',
  keywords:    ['tresses africaines', 'histoire africaine', 'photographie', 'culture africaine', 'coiffure africaine'],
  openGraph: {
    siteName:    'BornQueens',
    type:        'website',
    locale:      'fr_FR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          
        </AuthProvider>
      </body>
    </html>
  )
}

// ─────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────

