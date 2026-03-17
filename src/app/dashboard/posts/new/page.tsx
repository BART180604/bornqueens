// ═══════════════════════════════════════════════════════════
// src/app/dashboard/posts/new/page.tsx
// Page de création d'une nouvelle publication
// ═══════════════════════════════════════════════════════════

import type { Metadata } from 'next'
import Link              from 'next/link'
import PostForm          from '@/app/components/dashboard/PostForm'

export const metadata: Metadata = {
    title: 'Nouvelle publication — Dashboard BornQueens',
}

export default function NewPostPage() {
    return (
        <div>
            {/* Fil d'Ariane */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1.75rem',
                fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)',
            }}>
                <Link href="/dashboard/posts" style={{ color: 'var(--clr-gris)', textDecoration: 'none', transition: 'color 0.15s' }}

                >
                    ← Publications
                </Link>
                <span>›</span>
                <span style={{ color: 'var(--clr-bordeaux)' }}>Nouvelle publication</span>
            </nav>

            {/* Formulaire (sans prop post = mode création) */}
            <PostForm />
        </div>
    )
}


