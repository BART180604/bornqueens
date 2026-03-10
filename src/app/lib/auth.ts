import jwt  from "jsonwebtoken"
import { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET
const expires = process.env.JWT_EXPIRES_IN 

if(!JWT_SECRET){throw new Error("JWT_SECRET is not defined in environment variables")}
if(!expires){throw new Error("JWT_EXPIRES_IN is not defined in environment variables")}

//les types

export interface JWTPayload {
    userId: string,
    email: string,
    username:string,
    role: "VISITOR"| "CONTRIBUTOR" | "ADMIN"
}

export interface AuthUser extends JWTPayload {}

// Generer un token 

export function signToken(payload:JWTPayload):string {
   return jwt.sign(payload,JWT_SECRET!, {
    expiresIn: expires,
  } as jwt.SignOptions)
}

//verifier et decode 

export function decodeToken(token : string ) : JWTPayload | null {
   try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload
    
    return decoded
    
   } catch (error) {
    //token invalid , deformé
    console.error("Token verification failed:", error)
    return null
   }
}

export function extractToken(request: NextRequest): string | null {
  // Priorité 1 : Header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Priorité 2 : Cookie httpOnly (pour les pages SSR)
  const cookieToken = request.cookies.get('auth_token')?.value ?? null
  if (cookieToken) {
    return cookieToken
  }

  return null
}

// Fonction principale pour obtenir l'utilisateur actuel à partir de la requête
export function getCurrentUser(request: NextRequest): AuthUser | null {
  const token = extractToken(request)
  if (!token) return null
  return decodeToken(token)
}


// Fonctions d'autorisation suivant les rôles
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN'
}

export function isContributor(user: AuthUser | null): boolean {
  return user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN'
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return user !== null
}