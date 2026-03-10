import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { signToken } from "@/app/lib/auth";

function validateRegisterInput(body:unknown):{
    valid: boolean,
    errors : Record<string,string>
} {
    const errors : Record<string,string> = {}
    const data = body as Record<string , unknown> 

    //1.validation des champs 
    if (!data.email || typeof data.email !== 'string') {
        errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
         errors.email = 'Format d\'email invalide'
    }

    if (!data.username || typeof data.username !== 'string') {
        errors.username = 'Le nom d\'utilisateur est requis'
    } else if (data.username.length < 3) {
        errors.username = 'Minimum 3 caractères'
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = 'Lettres, chiffres et underscore uniquement'
    }

  if (!data.password || typeof data.password !== 'string') {
    errors.password = 'Le mot de passe est requis'
  } else if (data.password.length < 8) {
    errors.password = 'Minimum 8 caractères'
  }

  if (!data.displayName || typeof data.displayName !== 'string') {
    errors.displayName = 'Le nom d\'affichage est requis'
  }

  return { valid: Object.keys(errors).length === 0, errors }
   
  
}

//2.Handler 
export async function POST(request:NextRequest) {
    
   try {

     const body = await request.json()

    //validation des données
    const {valid,errors} = validateRegisterInput(body)
    if(!valid){
        return NextResponse.json({
            success:false , message:"Données Invalides" , errors
        },{status:400})
    }

    const {email, username, password,displayName}=body;

    //2.1 rechercher de l'existance dun utlisateur:
    const isExist = await prisma.user.findFirst({
        where: {
            OR : [
                {email:email.toLowerCase()},
                {username:username.toLowerCase()}
            ]
        }
    })
    if(isExist){
        const field = isExist.email === email.toLowerCase() ? "email" : "username"
        return NextResponse.json({
            success : false,
            message : " Cet Utilisteur existe dejà",
            errors : {[field] : `Cet ${field} existe déja`}
        },{status:409})
    }

    //2.2hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password,12)

    //2.3 créer l'utilisateur
    const user = await prisma.user.create({
        data:{
            email:email.toLowerCase(),
            username:username.toLowerCase(),
            password:hashedPassword,
            displayName
            
        },
        select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      }
    })

    //2.4 génerer le token 
    const token = signToken({
        userId:user.id,
        username:user.username,
        email:user.email,
        role:user.role
    })

    // 2.5. Réponse avec cookie httpOnly + body JSON
    const response = NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        user,
        token,
      },
      { status: 201 }
    )

    //2.6cookie
    response.cookies.set("auth_token", token ,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
        path: '/',
    })

    return response
    
   } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
   

}