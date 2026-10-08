import { Link } from 'react-router-dom'
import { Star, Clock, ChevronRight, Play, Ticket } from 'lucide-react'
import MoviePoster from './MoviePoster'
import type { Movie } from '../types'

interface MovieCardProps {
  movie: Movie
  index?: number
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const delay = Math.min(index * 0.04, 0.4)
  const isUpcoming = movie.status === 'UPCOMING'

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block rounded-2xl overflow-hidden glass border border-white/8 card-hover flex flex-col h-full"
      style={{ animationDelay: `${delay}s` }}
      id={`movie-card-${movie.id}`}
    >
      {/* Poster Container */}
      <div className="relative overflow-hidden">
        <MoviePoster posterUrl={movie.posterUrl} title={movie.title} />

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="badge badge-amber flex items-center gap-1 shadow-lg backdrop-blur-md text-[10px] sm:text-[11px] py-0.5 sm:py-1 px-2 sm:px-2.5 font-bold">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Hover overlay with cinematic action prompt */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
          <div className="w-full flex items-center justify-between text-white text-xs font-semibold">
            {isUpcoming ? (
              <span className="flex items-center gap-1.5 text-purple-300">
                <Play className="w-3.5 h-3.5 fill-current" /> View Trailer
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-400">
                <Ticket className="w-3.5 h-3.5" /> Book Tickets
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Info Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-100 text-base line-clamp-1 group-hover:text-red-400 transition-colors leading-snug mb-1.5">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2.5 text-xs text-slate-400 mb-2">
            {movie.durationMins > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m
              </span>
            )}
            {movie.genres && movie.genres[0] && (
              <span className="text-slate-500">• {movie.genres[0]}</span>
            )}
          </div>

          {movie.overview && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {movie.overview}
            </p>
          )}
        </div>

        {/* Bottom Status strip */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
          {isUpcoming ? (
            <span className="text-purple-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" /> Bookings Open Soon
            </span>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> In Cinemas Now
            </span>
          )}
          {movie.language && (
            <span className="uppercase text-slate-500 font-semibold text-[10px]">
              {movie.language}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
