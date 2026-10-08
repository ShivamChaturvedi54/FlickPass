import { useState, useEffect } from 'react'
import { X, Play } from 'lucide-react'

interface TrailerModalProps {
  trailerUrl: string
  movieTitle: string
  onClose: () => void
}

export default function TrailerModal({ trailerUrl, movieTitle, onClose }: TrailerModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Ensure autoplay URL
  const embedUrl = trailerUrl.includes('autoplay')
    ? trailerUrl
    : `${trailerUrl}${trailerUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-red-500 fill-red-500 ml-0.5" />
            </div>
            <h3 className="font-display font-semibold text-white text-base sm:text-lg">
              {movieTitle} — Official Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-slate-300 hover:text-white"
            aria-label="Close Trailer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 16:9 Video Embed */}
        <div className="relative w-full bg-black aspect-video">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={`${movieTitle} Official Trailer`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

// ─── Trigger button ────────────────────────────────────────────────────────────
export function TrailerButton({
  trailerUrl,
  movieTitle,
  className = '',
  initialOpen = false,
}: {
  trailerUrl?: string | null
  movieTitle: string
  className?: string
  initialOpen?: boolean
}) {
  const [open, setOpen] = useState(initialOpen)

  // Resolve trailer URL or fallback to YouTube search embed
  const resolvedUrl =
    trailerUrl && trailerUrl.length > 0
      ? trailerUrl
      : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movieTitle + ' official trailer')}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`px-5 py-3 rounded-xl glass border border-white/15 text-white hover:bg-white/10 hover:border-white/30 transition-all font-semibold flex items-center gap-2.5 shadow-lg group ${className}`}
        id="trailer-btn"
        type="button"
      >
        <div className="w-7 h-7 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 transition-all">
          <Play className="w-3.5 h-3.5 text-red-400 group-hover:text-white fill-current ml-0.5" />
        </div>
        <span>Watch Trailer</span>
      </button>

      {open && (
        <TrailerModal
          trailerUrl={resolvedUrl}
          movieTitle={movieTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
