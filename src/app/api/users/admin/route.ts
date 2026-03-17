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
        const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
        const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20'))
        const role   = searchParams.get('role')   || 'all'
        const search = searchParams.get('search') || ''

        const where: any = {
            ...(role !== 'all' && { role }),
            ...(search && {
                OR: [
                    { username:    { contains: search, mode: 'insensitive' } },
                    { displayName: { contains: search, mode: 'insensitive' } },
                    { email:       { contains: search, mode: 'insensitive' } },
                ]
            })
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip:    (page - 1) * limit,
                take:    limit,
                select: {
                    id: true, username: true, displayName: true,
                    email: true, role: true, isActive: true,
                    avatarUrl: true, createdAt: true,
                    _count: { select: { posts: true, comments: true } }
                }
            }),
            prisma.user.count({ where })
        ])

        return NextResponse.json({
            success: true,
            users,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('[GET USERS ADMIN]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}

// Modifier le rôle ou le statut d'un utilisateur
export async function PATCH(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }

        const { userId, role, isActive } = await request.json()
        if (!userId) {
            return NextResponse.json({ success: false, message: 'userId requis' }, { status: 400 })
        }

        // Empêcher l'admin de se modifier lui-même
        if (userId === user.userId) {
            return NextResponse.json({ success: false, message: 'Vous ne pouvez pas modifier votre propre compte' }, { status: 400 })
        }

        const data: any = {}
        if (role     !== undefined) data.role     = role
        if (isActive !== undefined) data.isActive = isActive

        const updated = await prisma.user.update({
            where:  { id: userId },
            data,
            select: {
                id: true, username: true, displayName: true,
                email: true, role: true, isActive: true
            }
        })

        return NextResponse.json({ success: true, user: updated })

    } catch (error) {
        console.error('[PATCH USER ADMIN]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}