import {NextRequest,NextResponse} from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import {prisma} from "@/app/lib/prisma"

type Params ={params:{id:string}}

export async function POST(request:NextRequest,{params}:Params) {
    
    try {
        //recupérer 'utilisateur actuel
        const user = await getCurrentUser(request)
        if(!user){
            return NextResponse.json({
                success:false ,message:"Utilisateur non authentifié"
            },{status:401})
        }
        //recupérer le post
        const postId= params.id
        const post = await prisma.post.findUnique({
            where:{
                id:postId, status:"PUBLISHED"
            }
        })

        if(!post){
            return NextResponse.json({
                success:false,message:"Post Introuvable"
            },{status:400})
        }

        //verifié si un like existe deja sur un poste
        const existingLike= await prisma.like.findUnique({
            where:{
                postId_authorId:{postId,authorId:user.userId }
            }
        })

        if (existingLike){
            //unlike si déja liké
            await prisma.like.delete({ where: { id: existingLike.id } })
            const count =await prisma.like.count({where:{postId}})
            return NextResponse.json({success:true,liked:false,likesCount:count})
        }else{
            //créer sinon
            await prisma.like.create({data:{authorId:user.userId,postId}})
            const count = await prisma.like.count({where:{postId}})
            return NextResponse.json({
               success:true,liked:true, likesCount:count
           })
        }
        
    } catch (error) {
        console.error("[POST LIKE]", error)
        return NextResponse.json({
            success:false,message:"Server Intern Error"
        },{status:500})
    }
}