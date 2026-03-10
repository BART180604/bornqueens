import {NextRequest, NextResponse} from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type Params = { params: { id: string } }

export const selectAuthor = {
    select:{id:true, username:true,displayName:true,avatarUrl:true}
}

//GET lister les commentaires d'un post
export async function GET(request:NextRequest,{params}:Params) {
    
    try {
        const {searchParams} = new URL(request.url)
        //la pagination (ne pas récup'  tous les commentaires d'un coup)
        const page = Math.max(1,parseInt(searchParams.get("page")|| "1"))
        const limit = Math.min(50,parseInt(searchParams.get("limit")||"15"))
        const skip = (page-1)*limit

        const postId= params.id
        //rechercher le post avec id ou slug
        const post = await prisma.post.findFirst({
            where:{
                OR:[{id:postId},{slug:postId}],
                    
                status:"PUBLISHED"
            }
        })
        if(!post){
            return NextResponse.json({
                success:false,message:"Post introuvable"
            },{status:404})
        }

        //recupérer uniquement les commentaires racine (parent null)
        //les enfants sont imbriqués dedans
        const [comments,total] = await Promise.all([
            prisma.comment.findMany({
                where:{
                    postId:post.id,isApproved:true,isDeleted:false,parentId:null
                },
                orderBy:{createdAt:"desc"},
                skip,
                take:limit,
                include:{
                    author:selectAuthor,
                    replies:{
                        where:{
                            isApproved:true, isDeleted:false
                        },
                        orderBy:{createdAt:"asc"},
                        include:{author:selectAuthor}
                    },
                    _count:{select:{replies:true}}
                },
                
            }),
            prisma.comment.count({
               where: { postId: post.id, isApproved: true, isDeleted: false, parentId: null }
            })
        ])
        return NextResponse.json({
            success:true,
            comments,
            pagination:{
                page,limit,total,
                totalPage:Math.ceil(total/limit),
                hasNextPage: page<Math.ceil(total/limit),
                hasPrevPage: page>1
            }
        })
    } catch (error) {
        console.error("[GET POST COMMENTS]",error)
        return NextResponse.json({
            success:false,message:"Server error"
        },{status:500})
    }
}

//POST creer un commentaire sur un post
export async function POST(request:NextRequest,{params}:Params) {
    try {
        //Auth obligatoire pour commenter
        const user = await getCurrentUser(request)
        if(!user){
            return NextResponse.json(
                {
                    success:false, message:"Utilisateur non authentifié"
                }
            ),{status:401}
        }
        const post = await prisma.post.findFirst({
            where:{
                OR:[{id:params.id},{slug:params.id}], status:"PUBLISHED"
            }
        })
        if(!post){
            return NextResponse.json({
                success:false,message:"Post Introuvable"
            },{status:404})
        }

        const body = await request.json()
        const {content,parentId} = body
        //validation du contenue envoyé
        if(!content?.trim()){
            return NextResponse.json({success:false,message:"Le contenu du commentaire est requis"})
        }
        if(content.trim().length>2000){
            return NextResponse.json({success:false, message:"Le commentaire ne peut excéder les 2000 caractère"})
        }
        //verifier le commentaire parent si c'est une réponse
        if(parentId){
            const parentComment = await prisma.comment.findFirst({
                where:{
                    id:parentId,isDeleted:false,postId:post.id
                }
            })
            if(!parentComment){
                return NextResponse.json({
                    success:false,message:"Il semblerais que vous tentiez de repondre à un commentaire qui n'existe pas"
                },{status:404})
            }
            //On autorise ici qu'un seul niveau d'imbrication
            if(parentComment.parentId){
               return NextResponse.json({ success:false,message:"Un seul niveau d'imbrication "})
            }
        }

        //auto approuvé les admin 
        const isAdmin = user.role ==="ADMIN"
        const isApproved= isAdmin
        const comment = await prisma.comment.create({
            data:{
                content: content.trim(),
                authorId: user.userId,
                postId: post.id,
                parentId: parentId || null,
                isApproved
            },
            include:{author:selectAuthor,replies:{include:{author:selectAuthor}}}
        })
        return NextResponse.json({
            success:true,
            message: isApproved?"Commentaire Publié" :"Votre commentaire sera publié après modération",
            comment,
            pending:!isApproved

        },{status:201})
      
    } catch (error) {
        console.error("[POST COMMENT]", error)
        return NextResponse.json({
            success:false,message:"Server Error"
        },{status:500})
    }
}