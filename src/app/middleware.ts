import { NextRequest,NextResponse } from "next/server";
import { getCurrentUser,isAdmin } from "@/app/lib/auth";

//les routes qui necessitent d'etre protéger

const AUTH_ROUTES = ["/dashboard", "/studio"]
const ADMIN_ROUTES = ["/dashboard"]

export function middleware(request:NextRequest) {
    const {pathname} = request.nextUrl

    //verifier si la route est proteger
    const isProtected = AUTH_ROUTES.some(route=>pathname.startsWith(route))
    if(!isProtected){
        return NextResponse.next()
    }

    //recuperer l'ustlisateur
    const user = getCurrentUser(request)

    //redirigé lutilisateur non authentifié
    if(!user){
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
    }

    //verification d'une route d'Admin
    const isAdminRoute = ADMIN_ROUTES.some(route=>pathname.startsWith(route))
    if(isAdminRoute && !isAdmin(user) ){
        //rediriger vers la page d'acceuil
        return NextResponse.redirect(new URL("/",request.url))
    }

    //tout est OK on laisse passer la requete
    return NextResponse.next()
}
export const config = {
  // Appliquer le middleware uniquement sur ces chemins
  matcher: ['/dashboard/:path*', '/studio/:path*'],
}