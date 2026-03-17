import {NextResponse,NextRequest} from 'next/server'
import {prisma} from "@/app/lib/prisma"
import { getCurrentUser } from '@/app/lib/auth'


export async function GET(request:NextRequest){
    try {
        //1. extraire et verifier le token 
        const authUser =  getCurrentUser(request)
        if(!authUser){
            return NextResponse.json({
                success:false,
                message:"Non authentifié"

            },{status:401})
        }
        //récupérer les données depuis la base de donnée
        const user= await prisma.user.findUnique({
            where:{id:authUser.userId},
            select:{
                id:true,
                email:true,
                username:true,
                displayName:true,
                avatarUrl:true,
                bio:true,
                role:true,
                createdAt:true,
                _count:{
                    select:{
                        posts:true,
                        likes:true,
                        savedPosts:true
                    }
                }

            },
            
        })

        if(!user){
            return NextResponse.json({
                success:false,
                message:"Utilisateur introuvable"
            },{status:400})
        }
        // 3.Ici, on retourne la réponse succès !
        return NextResponse.json({
            success: true,
            user
        })
    } catch (error) {
        console.error("[ME ERROR]", error)
        return NextResponse.json({
            success:false,
            message:"Internal server Error"
        },{status:500})
    }
}