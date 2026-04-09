import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/app/lib/prisma'; 
import { signToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

//1 validation

function validateLoginInput(body:unknown):{
    errors: Record<string, string>
    valid : boolean
} {
    const errors : Record<string,string> ={}
    const data = body as Record<string,unknown>

    // validation des champs

    // validation du champs email
    if(!data.email || typeof data.email !== "string"){
        errors.email = " L' email est requis"
    }else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
         errors.email = 'Format d\'email invalide'
    }

    //validation du champ password
    if (!data.password || typeof data.password !== 'string') {
    errors.password = 'Le mot de passe est requis'
    } else if (data.password.length < 8) {
         errors.password = 'Minimum 8 caractères'
    }

    return { valid: Object.keys(errors).length === 0, errors }
}

//2 Handleur

export async function POST(request:NextRequest) {
    try {
         //validation des données
         const body = await request.json()
        const {valid,errors} = validateLoginInput(body)
        if(!valid){
            return NextResponse.json({
                 success:false , message:"Données Invalides" , errors
            },{status:400})
        }

        const {email,password} = body

        //recherche en base de donné

        const user = await prisma.user.findUnique({
            where :{
                email:email.toLowerCase()
            }
        }
           
        )

        if(!user?.isActive){
            return NextResponse.json({
                success:false, message: " Identifiants invalide"
            },{status:401})
        }

        //comparaison le mot de passe avec le hash
        const passwordMatched = await bcrypt.compare(password,user.password)
        if(!passwordMatched){
            return NextResponse.json({
                success:false, message:"Identifiant incorect"
            },{status:401})
        }

        //générer le token
        const token =  signToken({
            userId:user.id,
            email:user.email,
            username:user.username,
            role:user.role
        })

        //préparer les données utilisateurs à renvoyer
        const {password: _, ...userWithoutPassword } = user
        const response = NextResponse.json({
            success:true,
            message:"Connexion réussie",
            user: userWithoutPassword,
            token,
        },{status:200})
        
        response.cookies.set('auth_token', token ,{
            httpOnly:true,
            secure:process.env.NODE_ENV !== "development",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        })

        return response
    } catch (error) {
        console.error("[LOGIN ERROR]",error)
        return NextResponse.json({
            succes:false,
            message:"Erreur Server Interne"
        },{status:500})
    }
}
