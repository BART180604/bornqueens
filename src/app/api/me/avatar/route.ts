import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/app/lib/auth"
import { processAvatarImage, validateUpload } from "@/app/lib/upload"
import { prisma } from "@/app/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ success: false, message: "Utilisateur non authentifié" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("avatar") as File

        const validationErrors = validateUpload(file)
        if (validationErrors) {
            return NextResponse.json({ success: false, message: "Fichier invalide", errors: validationErrors }, { status: 400 })
        }

        if (!file) {
            return NextResponse.json({ success: false, message: "Aucun fichier reçu" }, { status: 400 })
        }

        // Traiter l'image
        const result = await processAvatarImage(file)

        // ← LA LIGNE MANQUANTE : sauvegarder en base
        await prisma.user.update({
            where: { id: user.userId },
            data:  { avatarUrl: result.path }
        })

        return NextResponse.json({ success: true, file: result }, { status: 200 })

    } catch (err) {
        console.error("[POST AVATAR]", err)
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
    }
}