import { useState } from 'react'

interface MoviePosterProps {
  posterUrl: string | null
  title: string
  className?: string
  aspectRatio?: 'poster' | 'square'
}

// SVG Fallback when TMDB image fails or is missing
function PosterFallback({ title }: { title: string }) {
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-inherit">
      <svg viewBox="0 0 100 140" className="w-16 h-20 mb-3 opacity-30" fill="none">
        <rect width="100" height="140" rx="8" fill="#334155" />
        <circle cx="50" cy="50" r="20" fill="#475569" />
        <rect x="20" y="80" width="60" height="8" rx="4" fill="#475569" />
        <rect x="30" y="96" width="40" height="6" rx="3" fill="#334155" />
        <rect x="35" y="110" width="30" height="6" rx="3" fill="#334155" />
        <polygon points="40,38 62,50 40,62" fill="#64748b" />
      </svg>
      <span className="text-4xl font-bold text-slate-600 font-display">{initials}</span>
      <span className="text-xs text-slate-600 mt-2 px-4 text-center line-clamp-2">{title}</span>
    </div>
  )
}

// Skeleton loader while image loads
function PosterSkeleton() {
  return <div className="skeleton w-full h-full rounded-inherit" />
}

export default function MoviePoster({ posterUrl, title, className = '', aspectRatio = 'poster' }: MoviePosterProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const aspectClass = aspectRatio === 'poster' ? 'aspect-[2/3]' : 'aspect-square'

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${aspectClass} ${className}`}>
      {/* Skeleton */}
      {loading && !error && <PosterSkeleton />}

      {/* Fallback */}
      {(error || !posterUrl) && <PosterFallback title={title} />}

      {/* Actual image */}
      {posterUrl && !error && (
        <img
          src={posterUrl}
          alt={`${title} poster`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false) }}
          loading="lazy"
        />
      )}
    </div>
  )
}
