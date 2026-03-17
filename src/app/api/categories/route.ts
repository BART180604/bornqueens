// src/app/api/categories/route.ts
// GET  /api/categories        — Lister toutes les catégories (public)
// POST /api/categories        — Créer une catégorie (admin)

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/app/lib/prisma'
import { getCurrentUser, isAdmin }   from '@/app/lib/auth'

// ─────────────────────────────────────────
// GET — Lister les catégories
// ─────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const withCount = searchParams.get('withCount') !== 'false'

        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                // _count uniquement si demandé (évite une jointure inutile dans PostForm)
                ...(withCount && {
                    _count: { select: { posts: true } }
                }),
            }
        })

        return NextResponse.json({ success: true, categories })

    } catch (error) {
        console.error('[GET CATEGORIES]', error)
        return NextResponse.json(
            { success: false, message: 'Erreur serveur' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────
// POST — Créer une catégorie
// ─────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user || !isAdmin(user)) {
            return NextResponse.json(
                { success: false, message: 'Accès refusé — Admin requis' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, description, color } = body

        // Validation
        if (!name?.trim()) {
            return NextResponse.json(
                { success: false, message: 'Le nom est requis' },
                { status: 400 }
            )
        }
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return NextResponse.json(
                { success: false, message: 'Couleur invalide — format attendu : #RRGGBB' },
                { status: 400 }
            )
        }

        // Générer le slug depuis le nom
        const slug = name
            .trim()
            .toLowerCase()
            .normalize('NFD')                     // décomposer les accents
            .replace(/[\u0300-\u036f]/g, '')      // supprimer les diacritiques
            .replace(/[^a-z0-9\s-]/g, '')         // garder lettres, chiffres, espaces, tirets
            .replace(/\s+/g, '-')                 // espaces → tirets
            .replace(/-+/g, '-')                  // tirets multiples → un seul
            .replace(/^-|-$/g, '')               // supprimer tirets en début/fin

        // Vérifier l'unicité du slug
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (existing) {
            return NextResponse.json(
                { success: false, message: `Une catégorie avec ce nom existe déjà (slug: ${slug})` },
                { status: 409 }
            )
        }

        const category = await prisma.category.create({
            data: {
                name:        name.trim(),
                slug,
                description: description?.trim() || null,

            }
        })

        return NextResponse.json(
            { success: true, message: 'Catégorie créée', category },
            { status: 201 }
        )

    } catch (error) {
        console.error('[POST CATEGORY]', error)
        return NextResponse.json(
            { success: false, message: 'Erreur serveur' },
            { status: 500 }
        )
    }
}