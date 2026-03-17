export const dynamic = 'force-dynamic'

// src/app/studio/posts/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { prisma }   from '@/app/lib/prisma'
import PostForm     from '@/app/components/dashboard/PostForm'

type Params = { params: Promise<{ id: string }> }

export default async function StudioEditPostPage({ params }: Params) {
    const { id } = await params

    const post = await prisma.post.findUnique({
        where:   { id },
        include: {
            photos:     { orderBy: { order: 'asc' } },
            categories: { select: { categoryId: true } },
            tags:       { select: { tag: { select: { name: true } } } },
        }
    })

    if (!post) notFound()

    const formPost = {
        id:         post.id,
        title:      post.title,
        excerpt:    post.excerpt,
        content:    post.content,
        region:     post.region,
        period:     post.period,
        status:     post.status,
        coverIndex: post.coverIndex,
        photos:     post.photos.map(p => ({
            filename:         p.filename,
            path:             p.path,
            thumbPath:        p.thumbPath,
            width:            p.width  || 0,
            height:           p.height || 0,
            size:             p.size   || 0,
            caption:          p.caption          || undefined,
            alt:              p.alt              || undefined,
            photographerName: p.photographerName || undefined,
            modelName:        p.modelName        || undefined,
        })),
        categories: post.categories.map(pc => ({ id: pc.categoryId })),
        tags:       post.tags.map(pt => ({ name: pt.tag.name })),
    }

    return <PostForm post={formPost} />
}