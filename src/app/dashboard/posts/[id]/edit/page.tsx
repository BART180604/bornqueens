export const dynamic = 'force-dynamic'


// src/app/dashboard/posts/[id]/edit/page.tsx
// Page d'édition d'une publication existante


import { notFound } from 'next/navigation'
import { prisma }   from '@/app/lib/prisma'
import PostForm from "@/app/components/dashboard/PostForm";
import Link from "next/link";
import {Metadata} from "next";


type EditParams = { params: Promise<{ id: string }> }
const metadata: Metadata = {
    title: 'Nouvelle publication — Dashboard BornQueens',
}

export async function generateMetadata({ params }: EditParams): Promise<Metadata> {
    const {id:postId} = await params
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { title: true } })
    return { title: post ? `Modifier "${post.title}" — Dashboard` : 'Publication introuvable' }
}

export async function EditPostPage({ params }: Readonly<EditParams>) {
    // Charger la publication complète avec toutes ses relations
    const {id:postId} = await params
    const post = await prisma.post.findUnique({
        where: { id: postId},
        include: {
            photos:     { orderBy: { order: 'asc' } },
            categories: { select: { categoryId: true } },
            tags:       { select: { tag: { select: { name: true } } } },
        }
    })

    if (!post) notFound()

    // Transformer pour le format attendu par PostForm
    const formPost = {
        id:          post.id,
        title:       post.title,
        excerpt:     post.excerpt,
        content:     post.content,
        region:      post.region,
        period:      post.period,
        status:      post.status,
        coverIndex:  post.coverIndex,
        // Photos : on re-mappe vers le format UploadedPhoto que PostForm attend
        photos: post.photos.map(p => ({
            filename:          p.filename,
            path:              p.path,
            thumbPath:         p.thumbPath,
            width:             p.width  || 0,
            height:            p.height || 0,
            size:              p.size   || 0,
            caption:           p.caption        || undefined,
            alt:               p.alt            || undefined,
            photographerName:  p.photographerName || undefined,
            modelName:         p.modelName       || undefined,
        })),
        categories: post.categories.map(pc => ({ id: pc.categoryId })),
        tags:       post.tags.map(pt => ({ name: pt.tag.name })),
    }

    return (
        <div>
            {/* Fil d'Ariane */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1.75rem',
                fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)',
            }}>
                <Link href="/dashboard/posts" style={{ color: 'var(--clr-gris)', textDecoration: 'none' }}>
                    ← Publications
                </Link>
                <span>›</span>
                <span style={{ color: 'var(--clr-bordeaux)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px'
                }}>
          {post.title}
        </span>
            </nav>

            {/* Formulaire en mode édition */}
            <PostForm post={formPost} />
        </div>
    )
}

// Export par défaut pour Next.js App Router
export default EditPostPage