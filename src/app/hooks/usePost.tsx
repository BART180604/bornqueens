'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from "@/app/hooks/useAuth"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  region: string | null
  period: string | null
  coverIndex: number
  viewCount: number
  publishedAt: string
  author: { id: string; username: string; displayName: string | null; avatar: string | null }
  photos: { id: string; path: string; thumbPath: string; alt: string | null; order: number }[]
  categories: { id: string; name: string; slug: string; color: string | null }[]
  tags: { id: string; name: string; slug: string }[]
  likesCount: number
  commentsCount: number
}

interface Pagination {
  page: number; limit: number; total: number
  totalPages: number; hasNextPage: boolean; hasPrevPage: boolean
}

interface UsePostsOptions {
  page?: number; limit?: number
  category?: string; tag?: string; search?: string
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts]           = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.page)     params.set('page',     String(options.page))
      if (options.limit)    params.set('limit',    String(options.limit))
      if (options.category) params.set('category', options.category)
      if (options.tag)      params.set('tag',      options.tag)
      if (options.search)   params.set('search',   options.search)

      const res  = await fetch(`/api/posts?${params}`)
      const data = await res.json()

      if (data.success) {
        setPosts(data.posts)
        setPagination(data.pagination)
      } else {
        setError(data.message)
      }
    } catch {
      setError('Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [options.page, options.limit, options.category, options.tag, options.search])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  return { posts, pagination, isLoading, error, refetch: fetchPosts }
}

// ── Hook pour le toggle like avec optimistic UI ──
export function useLike(postId: string, initialCount: number, initialLiked = false) {
  const { token, isAuthenticated } = useAuth()
  const [liked, setLiked]          = useState(initialLiked)
  const [count, setCount]          = useState(initialCount)
  const [isLoading, setIsLoading]  = useState(false)

  const toggleLike = async () => {
    if (!isAuthenticated || isLoading) return

    // Optimistic UI — mise à jour immédiate avant la réponse serveur
    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!data.success) {
        // Rollback si erreur
        setLiked(prevLiked)
        setCount(prevCount)
      } else {
        // Synchroniser avec la valeur serveur
        setCount(data.likesCount)
        setLiked(data.liked)
      }
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setIsLoading(false)
    }
  }

  return { liked, count, toggleLike, isLoading }
}