// GET /api/posts  — Lister avec pagination + filtres
// POST /api/posts — Créer une publication

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser, isContributor } from '@/app/lib/auth'
import slugify from 'slugify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    //Gérer la pagination
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'))
    const skip  = (page - 1) * limit

    const category = searchParams.get('category')
    const tag      = searchParams.get('tag')
    const search   = searchParams.get('search')
    const status   = searchParams.get('status')
    const authorId = searchParams.get('author')

    //on réupère l'utilisateur connecté
    const currentUser = getCurrentUser(request)

    //protection contre la mnipulation des status par un nom admin
    const requestedStatus = status && currentUser?.role === 'ADMIN' ? status : 'PUBLISHED'

    //on créé un objet personnalisé where pour la requete prisma
    const where: Record<string, unknown> = {
      status: requestedStatus,
      ...(authorId && { authorId }),
      ...(search && {
        OR: [
          { title:   { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { region:  { contains: search, mode: 'insensitive' } },
        ]
      }),
      ...(category && { categories: { some: { category: { slug: category } } } }),
      ...(tag      && { tags:       { some: { tag:      { slug: tag      } } } }),
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          region: true, period: true, coverIndex: true,
          viewCount: true, publishedAt: true,
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          photos: {
            orderBy: { order: 'asc' },
            select: { id: true, path: true, thumbPath: true, alt: true, order: true }
          },
          categories: { select: { category: { select: { id: true, name: true, slug: true, color: true } } } },
          tags:       { select: { tag:      { select: { id: true, name: true, slug: true } } } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.post.count({ where })
    ])

    const formattedPosts = posts.map(post => ({
      ...post,
      categories:    post.categories.map(pc => pc.category),
      tags:          post.tags.map(pt => pt.tag),
      likesCount:    post._count.likes,
      commentsCount: post._count.comments,
      _count: undefined,
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page, limit, total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      }
    })
  } catch (error) {
    console.error('[GET POSTS]', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    //on récupère l'utilisateur connecté
    const user = getCurrentUser(request)
    if (!user || !isContributor(user)) {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, excerpt, content, region, period,
      status     = 'DRAFT',
      coverIndex = 0,
      photos     = [],
      categoryIds = [],
      tagNames    = [],
    } = body

    if (!title?.trim())   return NextResponse.json({ success: false, message: 'Titre requis' }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ success: false, message: 'Contenu requis' }, { status: 400 })
    if (!photos.length)   return NextResponse.json({ success: false, message: 'Au moins une photo requise' }, { status: 400 })

    // Slug unique
    let slug = slugify(title, { lower: true, strict: true, locale: 'fr' })
    const slugExists = await prisma.post.findUnique({ where: { slug } })
   
    if (slugExists) slug = `${slug}-${Date.now()}`

    // Tags upsert à la volée
    const tagIds: string[] = await Promise.all(
      tagNames.map(async (name: string) => {
        const tagSlug = slugify(name, { lower: true, strict: true })
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug }, update: {},
          create: { name, slug: tagSlug },
        })
        return tag.id
      })
    )

    const post = await prisma.post.create({
      data: {
        title: title.trim(), slug,
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        region:  region?.trim()  || null,
        period:  period?.trim()  || null,
        status, 
        coverIndex,
        authorId:    user.userId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        photos: {
          create: photos.map((p: Record<string, unknown>, i: number) => ({
            filename: p.filename as string,
            path:     p.path     as string,
            thumbPath: p.thumbPath as string,
            alt:      (p.alt      as string) || null,
            caption:  (p.caption  as string) || null,
            width:    (p.width    as number) || null,
            height:   (p.height   as number) || null,
            size:     (p.size     as number) || null,
            order: i,
            photographerName: (p.photographerName as string) || null,
            modelName:        (p.modelName        as string) || null,
          }))
        },
        categories: { create: categoryIds.map((id: string) => ({ categoryId: id })) },
        tags:       { create: tagIds.map((id: string) => ({ tagId: id })) },
      },
      include: {
        photos:     { orderBy: { order: 'asc' } },
        categories: { include: { category: true } },
        tags:       { include: { tag: true } },
        author:     { select: { id: true, username: true, displayName: true, avatar: true } },
      }
    })

    return NextResponse.json({
      success: true,
      message: status === 'PUBLISHED' ? 'Publication créée ✨' : 'Brouillon sauvegardé',
      post: {
        ...post,
        categories: post.categories.map(pc => pc.category),
        tags:       post.tags.map(pt => pt.tag),
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[CREATE POST]', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}