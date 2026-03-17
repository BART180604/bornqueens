import { NextRequest,NextResponse } from "next/server";
import { getCurrentUser,isAdmin } from "@/app/lib/auth";
import {prisma} from "@/app/lib/prisma"
import { deleteImage } from "@/app/lib/upload";
import { Prisma,Status} from "@/generated/prisma";
import slugify from "slugify";


type Params = {params:Promise<{id:string}>}

// ── Sélecteur complet réutilisable ──
const fullPostSelect = Prisma.validator<Prisma.PostSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  region: true,
  period: true,
  status: true,
  coverIndex: true,
  viewsCount: true,
  publishedAt: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true
    }
  },
  photos: {
    orderBy: { order: "asc" }
  },
  categories: {
    include: { category: true }
  },
  tags: {
    include: { tag: true }
  },
  _count: {
    select: { likes: true, comments: true }
  }
})
//récupérer un post   @GET id

export async function GET(request:NextRequest,{params}:Params){
    try {
        //récupérer le requérent
        const user = await getCurrentUser(request)

        //recupérer l'id du post depuis les parametre url
        const{ id:postId } = await params
        const post = await prisma.post.findFirst({
            where:{
                OR:[
                    {id:postId},{slug:postId}
                ],
                ...(user && isAdmin(user)? {} : {status:"PUBLISHED"})
                
            },
            select:fullPostSelect
            
        })
           
        if(!post){ return NextResponse.json({success:false, message:"Post Introuvable"})}

        //tout est ok , on incremente le compteur des vues
        prisma.post.update({
            where:{
                id:post.id
            },
            data:{
                viewsCount:{increment:1}
            }
        }).catch(()=>{})

        //recupérer les commentaires approuvé séparement
        const comments = await prisma.comment.findMany({
            where:{postId:post.id,isApproved:true, isDeleted:false,parentId:null},
            orderBy:{createdAt:"desc"},
            include:{
                author:{select:{id:true,username:true,displayName:true,avatarUrl:true}},
                replies:{
                    where:{
                        isApproved:true,isDeleted:false
                    },
                    orderBy:{createdAt:"asc"},
                    include:{
                        author:{select:{id:true,username:true,displayName:true,avatarUrl:true}}
                    }
                }
            }
        })
        return NextResponse.json({
            success:true,
            post:{
                ...post,
                categories:post.categories.map((pc)=>pc.category),
                tags:post.tags.map((pt)=>pt.tag),
                likesCount:post._count.likes,
                commentCount:post._count.comments,
                _count:undefined,
                comments,


            }
        })
    } catch (error) {
        console.error("[GET POST]", error)
        return NextResponse.json({success:false, message:"Un probleme est survrnue los de la recupération du post"},{status:500})
    }
}

//Mettre à jour un post @PUT   id

export async function PUT(request:NextRequest,{params}:Params){
    try {
        // récupérer l'utilsateur
        const user = getCurrentUser(request)
        if(!user){
            return NextResponse.json({success:false, message:"Utilisateur non authentifié"},{status:401})
        }

        const {id:postId} = await params
        const post = await prisma.post.findFirst({
            where: {id:postId}
        })
        if(!post) {
            return NextResponse.json({
                success:false, message:"Post introuvable"
            },{status:404})
        }

        if(post.authorId!==user.userId && !isAdmin(user)){
            return NextResponse.json({
                success:false, message:"Vous êtes pas habilité à effectuer cette action"
            },{status:403})
        }

        const body = await request.json()
        const {title,excerpt,content,region,period,coverIndex,status,categoryIds,tagNames}:{
            title:string
            excerpt:string
            content:string
            region:string
            period:string
            coverIndex:number 
            status:Status
            categoryIds?:string[]
            tagNames?:string[]
        } = body

       //validation runtime: s'assurer que le status envoyé est toujours une valeur de l'num
       const VALID_STATUSES = Object.values(Status)
       if(body.status && !VALID_STATUSES.includes(body.status)){
        return NextResponse.json({
            success:false, message:"Status Invalide"
        },{status:400})
       }
        //nouveau slug si le titre change
        let slug = post.slug
        if(title && title.trim()!==post.title){
            slug = slugify(title, {lower:true, strict:true,locale:"fr"})
            const slugExist = await prisma.post.findFirst({
                where:{
                    slug,NOT:{id:post.id}
                }

            })
            if(slugExist) slug= `${slug}-${Date.now()}`
        }

        //tags upsert
        let tagIds : string[] | undefined
        if(tagNames){
           tagIds= await Promise.all(
                tagNames.map(async(name:string)=>{
                    const tagSlug = slugify(name,{strict:true, lower:true})
                    const tag = await prisma.tag.upsert({
                        where:{
                            slug:tagSlug
                        },
                        update:{},
                        create:{name,slug:tagSlug}
                    })
                    return tag.id
                })
            )
        }

        // ── Gérer la suppression des photos retirées ──
        if (body.photos !== undefined) {
            const incomingFilenames = (body.photos as { filename: string }[]).map(p => p.filename)

            const photosToDelete = await prisma.photo.findMany({
                where: {
                    postId: post.id,
                    filename: { notIn: incomingFilenames }
                }
            })

            if (photosToDelete.length > 0) {
                // Supprimer les fichiers physiques
                await Promise.all(
                    photosToDelete.flatMap(p => [
                        deleteImage(p.path),
                        deleteImage(p.thumbPath),
                    ])
                )
                // Supprimer les lignes en base
                await prisma.photo.deleteMany({
                    where: {
                        id: { in: photosToDelete.map(p => p.id) }
                    }
                })
            }
        }

        // Mise à jour via transaction
        const updated = await prisma.$transaction(async(tx)=>{
            //recréé les relations categories tags si fourni
            if(categoryIds){
                await tx.postCategory.deleteMany({
                    where:{
                        postId:post.id
                    }
                })
            }
            if(tagIds){
                await tx.postTag.deleteMany({
                    where: {
                        postId:post.id
                    }
                })
            }
            return tx.post.update({
                where:{
                    id:post.id
                },
                data:{
                    ...(title && {title:title.trim(),slug}),
                    ...(excerpt !== undefined && {excerpt:excerpt?.trim() || null}),
                    ...(content && {content:content.trim()}),
                    ...(region !==undefined && {region:region?.trim() || null}) ,
                    ...(period !==undefined && {period:period?.trim() ||null}),
                    ...(coverIndex !== undefined &&{coverIndex}),
                    ...(status && { status, publishedAt: status === 'PUBLISHED' && !post.publishedAt ? new Date() : post.publishedAt}),
                    ...(categoryIds && {categories:{create:categoryIds.map((id:string)=>({categoryId:id}))}}),
                    ...(tagIds &&{tags: {create:tagIds.map((id:string)=>({tagId:id}))}})
         
           
           
                },
                select:fullPostSelect
            })
        })
        return NextResponse.json({
            success: true,
            message: 'Publication mise à jour',
            post: {
              ...updated,
              categories:updated.categories.map(pc=>pc.category),
              tags:updated.tags.map(pt=>pt.tag),
              likesCount:    updated._count.likes,
              commentsCount: updated._count.comments,
             _count: undefined,
            }
       })
    } catch (error) {
        console.error("[PUT ERROR]",error)
        return NextResponse.json({
            success:false, message:"Server Error"
        },{status:500})
    }
}

export async function DELETE(request:NextRequest,{params}:Params){
    try {
        //récupérer le requerent
        const user = getCurrentUser(request)
        if(!user){
            return NextResponse.json({
                success:false, message:"Utilisateur non authentifié"
            },{status:401})
        }
        //récupérer le post
        const {id:postId}=await params
        const post = await prisma.post.findUnique({
            where:{
                id:postId
            },
            include:{photos:true}
        })
        //si post non trouvé
        if(!post){
            return NextResponse.json({
                success:false, message:"Post non trouvé"
            },{status:404})
        }
        //
        if(post.authorId !== user.userId && !isAdmin(user)){
            return NextResponse.json({
                success:false, message:"Vous n'êtes pas habilité à effectuer une tel opération "
            },{status:403})
        }

        //tout est ok on supprime fichier et entrée en BDD
        await Promise.all(post.photos.map(photo=>deleteImage(photo.path)))
        await prisma.post.delete({
            where:{id:post.id}
        })
        return NextResponse.json({
            success:true, message:"Post supprimé"
        })
    } catch (error) {
        console.error("[DEL POST]",error)
        return NextResponse.json({
            success:false, message:"Un problème est intervenu dans la supression du post"
        },{status:500})
    }
}