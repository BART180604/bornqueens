// src/app/api/auth/logout/route.ts
// POST /api/auth/logout

import { NextResponse } from 'next/server'

export async function POST() {
  //personnalisé la reponse
  const response = NextResponse.json(
    { success: true, message: 'Déconnexion réussie' },
    { status: 200 }
  )

  // Supprimer le cookie en le faisant expirer immédiatement
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}