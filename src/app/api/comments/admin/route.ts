import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page   = Number.parseInt(searchParams.get('page')   || '1')
        const limit  = Number.parseInt(searchParams.get('limit')  || '20')
        const filter = searchParams.get('filter') || 'all'
        const search = searchParams.get('search') || ''

        const where: any = {
            isDeleted: false,
            ...(filter === 'pending'  && { isApproved: false }),
            ...(filter === 'approved' && { isApproved: true  }),
            ...(search && {
                content: { contains: search, mode: 'insensitive' }
            }),
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip:  (page - 1) * limit,
                take:  limit,
                include: {
                    author: { select: { id: true, username: true, displayName: true } },
                    post:   { select: { id: true, title: true, slug: true } },
                }
            }),
            prisma.comment.count({ where })
        ])

        return NextResponse.json({
            success: true,
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('[GET COMMENTS ADMIN]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}