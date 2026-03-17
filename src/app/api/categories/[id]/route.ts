// src/app/api/categories/[id]/route.ts
// GET    /api/categories/[id]  — Détail d'une catégorie
// PUT    /api/categories/[id]  — Modifier (admin)
// DELETE /api/categories/[id]  — Supprimer (admin)

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/app/lib/prisma'
import { getCurrentUser, isAdmin }   from '@/app/lib/auth'

type Params = { params: Promise<{ id: string }> }

// ─────────────────────────────────────────
// GET — Détail
// ─────────────────────────────────────────

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const {id:catId} = await params
        const category = await prisma.category.findUnique({
            where:   { id: catId },
            include: { _count: { select: { posts: true } } }
        })

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Catégorie introuvable' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, category })

    } catch (error) {
        console.error('[GET CATEGORY]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}

// ─────────────────────────────────────────
// PUT — Modifier
// ─────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const user = getCurrentUser(request)
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }
        const {id:catId} = await params
        const existing = await prisma.category.findUnique({ where: { id: catId } })
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Catégorie introuvable' }, { status: 404 })
        }

        const { name, description, color } = await request.json()

        // Ne mettre à jour que les champs fournis
        const data: Record<string, any> = {}

        if (name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ success: false, message: 'Le nom ne peut pas être vide' }, { status: 400 })
            }
            data.name = name.trim()

            // Régénérer le slug si le nom change
            const newSlug = name.trim().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
                .replace(/-+/g, '-').replace(/^-|-$/g, '')

            // Vérifier l'unicité du nouveau slug (en excluant la catégorie actuelle)
            if (newSlug !== existing.slug) {
                const slugConflict = await prisma.category.findUnique({ where: { slug: newSlug } })
                if (slugConflict) {
                    return NextResponse.json(
                        { success: false, message: `Ce nom est déjà pris (slug: ${newSlug})` },
                        { status: 409 }
                    )
                }
                data.slug = newSlug
            }
        }

        if (description !== undefined) data.description = description?.trim() || null
        if (color       !== undefined) {
            if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
                return NextResponse.json({ success: false, message: 'Format couleur invalide' }, { status: 400 })
            }
            data.color = color || null
        }

        const category = await prisma.category.update({
            where: { id: catId },
            data,
        })

        return NextResponse.json({ success: true, message: 'Catégorie mise à jour', category })

    } catch (error) {
        console.error('[PUT CATEGORY]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}

// ─────────────────────────────────────────
// DELETE — Supprimer
// ─────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const user = getCurrentUser(request)
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }
        const {id:catId} = await params
        const category = await prisma.category.findUnique({
            where:   { id:catId },
            include: { _count: { select: { posts: true } } }
        })

        if (!category) {
            return NextResponse.json({ success: false, message: 'Catégorie introuvable' }, { status: 404 })
        }

        // Avertir si des publications sont liées
        // On supprime quand même — Prisma supprimera les lignes PostCategory en cascade
        // (onDelete: Cascade doit être défini dans le schema sur PostCategory)
        if (category._count.posts > 0) {
            const { force } = await request.json().catch(() => ({ force: false }))
            if (!force) {
                return NextResponse.json({
                    success: false,
                    message:    `Cette catégorie contient ${category._count.posts} publication(s)`,
                    requiresForce: true,
                    postsCount: category._count.posts,
                }, { status: 409 })
            }
        }

        await prisma.category.delete({ where: { id: catId } })

        return NextResponse.json({
            success: true,
            message: `Catégorie "${category.name}" supprimée`,
        })

    } catch (error) {
        console.error('[DELETE CATEGORY]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}