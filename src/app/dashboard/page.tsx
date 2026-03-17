// src/app/dashboard/page.tsx
// Vue d'ensemble — statistiques + publications récentes + commentaires en attente
import Link   from 'next/link'
import Image  from 'next/image'
import { prisma } from '@/app/lib/prisma'
import {Status} from "@/generated/prisma";

// ─────────────────────────────────────────
// DATA FETCHING (Server Component)
// ─────────────────────────────────────────
interface PostProps{
  status: Status;
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  publishedAt: Date | null;
  photos: {

    path: string;
  }[];
  _count: {
    comments: number;
    likes: number;
  };
}
interface TopPost{

  id: string
  title: string
  slug: string
  photos: {
    path: string
  }[]
  _count: {
    comments: number
    likes: number
  }
  viewsCount: number;
}
async function getDashboardStats() {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalUsers,
    totalLikes,
    recentPosts,
    pendingCommentsList,
    topPosts,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.comment.count({ where: { isDeleted: false } }),
    prisma.comment.count({ where: { isApproved: false, isDeleted: false } }),
    prisma.user.count(),
    prisma.like.count(),

    // 5 dernières publications
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, slug: true, status: true,
        publishedAt: true, createdAt: true,
        photos:  { take: 1, orderBy: { order: 'asc' }, select: {  path: true } },
        _count:  { select: { likes: true, comments: true } }
      }
    }),

    // Commentaires en attente de modération
    prisma.comment.findMany({
      where:   { isApproved: false, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      take: 5,
      include: {
        author: { select: { username: true, displayName: true } },
        post:   { select: { id: true, title: true, slug: true } }
      }
    }),

    // Top 3 publications par likes
    prisma.post.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { likes: { _count: 'desc' } },
      take: 3,
      select: {
        id: true, title: true, slug: true, viewsCount: true,
        photos:  { take: 1, orderBy: { order: 'asc' }, select: {  path: true } },
        _count:  { select: { likes: true, comments: true } }
      }
    }),
  ])

  return {
    stats: { totalPosts, publishedPosts, draftPosts, totalComments, pendingComments, totalUsers, totalLikes },
    recentPosts,
    pendingCommentsList,
    topPosts,
  }
}

// ─────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────

export default async function DashboardPage() {
  const { stats, recentPosts, pendingCommentsList, topPosts } = await getDashboardStats()

  return (
    <div style={{ maxWidth: '1200px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 600,
          color: 'var(--clr-noir)',
          marginBottom: '0.25rem',
        }}>
          Vue d&apos;ensemble
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--clr-gris)',
        }}>
          Tableau de bord BornQueens
        </p>
      </div>

      {/* ── STATISTIQUES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }} className="stats-grid">
        {[
          { label: 'Publications',  value: stats.totalPosts,    sub: `${stats.publishedPosts} publiées · ${stats.draftPosts} brouillons`, color: 'var(--clr-bordeaux)', icon: '✦' },
          { label: 'Commentaires',  value: stats.totalComments, sub: stats.pendingComments > 0 ? `${stats.pendingComments} en attente` : 'Tous modérés ✓', color: stats.pendingComments > 0 ? '#D97706' : '#059669', icon: '✉' },
          { label: 'Utilisateurs',  value: stats.totalUsers,    sub: 'Comptes actifs',         color: '#2563EB', icon: '◉' },
          { label: 'Likes totaux',  value: stats.totalLikes,    sub: 'Sur toutes les publications', color: '#DC2626', icon: '♥' },
        ].map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* ── CONTENU EN DEUX COLONNES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '1.5rem',
        alignItems: 'start',
      }} className="dashboard-cols">

        {/* ── PUBLICATIONS RÉCENTES ── */}
        <section>
          <SectionHeader
            title="Publications récentes"
            action={{ href: '/dashboard/posts', label: 'Tout gérer' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentPosts.length === 0 ? (
              <EmptyState
                icon="✦"
                message="Aucune publication pour l'instant"
                action={{ href: '/dashboard/posts/new', label: 'Créer la première publication' }}
              />
            ) : (
              recentPosts.map(post => (
                <PostRow key={post.id} post={post} />
              ))
            )}
          </div>

          {/* Top publications */}
          {topPosts.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <SectionHeader title="Les plus aimées" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topPosts.map((post, i) => (
                  <TopPostRow key={post.id} post={post} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── COLONNE DROITE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Commentaires en attente */}
          <section>
            <SectionHeader
              title={`Modération ${stats.pendingComments > 0 ? `(${stats.pendingComments})` : ''}`}
              action={{ href: '/dashboard/comments', label: 'Tout voir' }}
            />
            {pendingCommentsList.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '1.5rem',
                textAlign: 'center',
                color: '#059669',
                fontFamily: 'var(--font-body)',
                fontSize: '0.825rem',
                border: '1px solid #D1FAE5',
              }}>
                ✓ Aucun commentaire en attente
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingCommentsList.map(comment => (
                  <PendingCommentRow key={comment.id} comment={comment} />
                ))}
              </div>
            )}
          </section>

          {/* Actions rapides */}
          <section>
            <SectionHeader title="Actions rapides" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { href: '/dashboard/posts/new', icon: '+',  label: 'Nouvelle publication',      color: 'var(--clr-bordeaux)' },
                { href: '/dashboard/comments',  icon: '✉',  label: 'Modérer les commentaires', color: '#D97706' },
                { href: '/dashboard/users',     icon: '◉',  label: 'Gérer les utilisateurs',   color: '#2563EB' },
                { href: '/',                    icon: '↗',  label: 'Voir le site public',       color: 'var(--clr-gris)' },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.06)',
                    textDecoration: 'none',
                    color: 'var(--clr-noir)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.825rem',
                    transition: 'all 0.2s var(--ease-elegant)',
                  }}

                >
                  <span style={{ color: action.color, fontSize: '1rem', width: '20px', textAlign: 'center' }}>
                    {action.icon}
                  </span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .dashboard-cols { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px)  { .stats-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 500px)  { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: number; sub: string; color: string; icon: string
}) {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderTop: `3px solid ${color}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-gris)' }}>
          {label}
        </span>
        <span style={{ color, fontSize: '1rem' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--clr-noir)', lineHeight: 1, marginBottom: '0.5rem' }}>
        {value.toLocaleString('fr-FR')}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
        {sub}
      </div>
    </div>
  )
}

function SectionHeader({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
        {title}
      </h2>
      {action && (
        <Link href={action.href} style={{
          fontFamily: 'var(--font-body)', fontSize: '0.7rem',
          color: 'var(--clr-bordeaux)', textDecoration: 'none',
          letterSpacing: '0.05em',
          transition: 'opacity 0.2s',
        }}>
          {action.label} →
        </Link>
      )}
    </div>
  )
}

function PostRow({ post }: Readonly<{ post: PostProps }>) {
  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED: { bg: '#D1FAE5', color: '#065F46', label: 'Publié' },
    DRAFT:     { bg: '#FEF3C7', color: '#92400E', label: 'Brouillon' },
    ARCHIVED:  { bg: '#F3F4F6', color: '#6B7280', label: 'Archivé' },
  }
  const s = STATUS_STYLES[post.status] || STATUS_STYLES.DRAFT

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.875rem 1rem',
      background: 'white',
      border: '1px solid rgba(0,0,0,0.06)',
      transition: 'border-color 0.2s',
    }}>
      {/* Miniature */}
      <div style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden', background: '#F3F4F6' }}>
        {post.photos[0] && (
          <Image
            src={ post.photos[0].path}
            alt={post.title}
            width={48} height={48}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.825rem',
          fontWeight: 500, color: 'var(--clr-noir)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '0.2rem',
        }}>
          {post.title}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6rem',
            padding: '0.1rem 0.5rem',
            background: s.bg, color: s.color,
            borderRadius: '999px',
          }}>
            {s.label}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
            ♡ {post._count.likes} · ✉ {post._count.comments}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <Link href={`/posts/${post.slug}`} target="_blank"
          style={{ padding: '0.3rem 0.6rem', fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)', border: '1px solid rgba(0,0,0,0.1)', textDecoration: 'none', transition: 'all 0.2s' }}>
          ↗
        </Link>
        <Link href={`/dashboard/posts/${post.id}/edit`}
          style={{ padding: '0.3rem 0.75rem', fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-bordeaux)', border: '1px solid var(--clr-bordeaux)', textDecoration: 'none', transition: 'all 0.2s' }}>
          Modifier
        </Link>
      </div>
    </div>
  )
}

function TopPostRow({ post, rank }: Readonly<{ post: TopPost; rank: number }>) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.875rem 1rem',
      background: 'white',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
        color: rank === 1 ? 'var(--clr-or)' : 'rgba(0,0,0,0.15)',
        width: '24px', textAlign: 'center', flexShrink: 0,
      }}>
        {rank}
      </span>
      <div style={{ width: '40px', height: '40px', flexShrink: 0, overflow: 'hidden' }}>
        {post.photos[0] && (
          <Image src={ post.photos[0].path} alt="" width={40} height={40}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
          ♥ {post._count.likes} · {post.viewsCount} vues
        </p>
      </div>
    </div>
  )
}

function PendingCommentRow({ comment }: { comment: any }) {
  return (
    <div style={{
      padding: '0.875rem 1rem',
      background: 'white',
      border: '1px solid #FEF3C7',
      borderLeft: '3px solid #D97706',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 500, color: 'var(--clr-noir)' }}>
          {comment.author.displayName || comment.author.username}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
          sur <em>{comment.post.title.substring(0, 24)}…</em>
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '0.775rem', color: 'var(--clr-gris)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        marginBottom: '0.5rem',
      }}>
        {comment.content}
      </p>
      <Link href="/dashboard/comments" style={{
        fontFamily: 'var(--font-body)', fontSize: '0.65rem',
        color: 'var(--clr-bordeaux)', textDecoration: 'none', letterSpacing: '0.05em',
      }}>
        Modérer →
      </Link>
    </div>
  )
}

function EmptyState({ icon, message, action }: { icon: string; message: string; action?: { href: string; label: string } }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'rgba(0,0,0,0.2)' }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.825rem', color: 'var(--clr-gris)', marginBottom: action ? '1rem' : 0 }}>
        {message}
      </p>
      {action && <Link href={action.href} className="btn-primary" style={{ display: 'inline-flex' }}><span>{action.label}</span></Link>}
    </div>
  )
}