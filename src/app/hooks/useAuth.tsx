'use client'
import {useEffect, createContext, useState, useContext, ReactNode, useMemo} from "react";

// Définir les interface

interface User {
  id: string,
  email: string,
  username: string,
  bio: string | null,
  displayName: string | null,
  avatarUrl: string | null,
  role: "VISITOR" | "ADMIN" | "CONTRIBUTOR"
  createdAt: string
}

interface Register {
  email: string,
  password: string,
  username: string,
  displayName: string
}

interface AuthContextType {
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  isAdmin: boolean,
  isLoading: boolean,
  login: (email: string, password: string) => Promise<{ success: boolean, message: string }>
  register: (data: Register) => Promise<{ success: boolean, message: string,field?:string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// créer le context

const AuthContext = createContext<AuthContextType | null>(null)

// créer le provider

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [token, setToken] = useState<string | null>(null)

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, isLoading])
  // recuperate le token et l'utilisateur depuis le localStorage

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")

    if (storedToken) {
      setToken(storedToken)
      void fetchCurrentUser(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // récupérer l'utilisateur connecté

  async function fetchCurrentUser(authToken: string) {
    try {
      const res = await fetch('api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // token invalide ou expiré on remove
        localStorage.removeItem("auth_token")
        setToken(null)
      }

    } catch (error) {
      console.error("Erreur lord de la récupération de l'utilisateur", error)
    } finally {
      setIsLoading(false)
    }
  }

  // login

  async function login(email: string, password: string) {
    try {
      const res = await fetch("api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem("auth_token", data.token)
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message }

    } catch (error) {
      console.error("Erreur lors de la connexion", error)
     return { success: false, message: "Impossible de connecter l'utilisateur" }
    } finally {
      setIsLoading(false)
    }
  }

  // register

  async function register(registerData: Register) {
    try {
      const res = await fetch("api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registerData)
      })

      const data = await res.json()

      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem("auth_token", data.token)
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message }

    } catch (error) {
      console.error("Impossible d'enregistrer l'utilisateur", error)
      return { success: false, message: "Impossible d'enregistrer l'utilisateur" }
    } finally {
      setIsLoading(false)
    }
  }

  // logout

  async function logout() {
    try {
      await fetch("api/auth/logout", {
        method: "POST"
      })
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem("auth_token")
    }
  }

  // 3. Ajouter la fonction entre logout et le return :
  async function refreshUser() {
    const storedToken = token || localStorage.getItem("auth_token")
    if (!storedToken) return
    await fetchCurrentUser(storedToken)
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }

  return context
}

// HELPER — Générer les headers avec le token

export function authHeaders(token: string | null): HeadersInit {
  if (!token) return { 'Content-Type': 'application/json' }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}