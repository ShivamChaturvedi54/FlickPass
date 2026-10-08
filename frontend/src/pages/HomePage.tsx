import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, Sparkles, TrendingUp,
  Film, Star, X, Calendar, Ticket, Clapperboard, SlidersHorizontal,
  ChevronDown, Check, RotateCcw, Play
} from 'lucide-react'
import { moviesApi } from '../api'
import MovieCard from '../components/MovieCard'
import { TrailerButton } from '../components/TrailerModal'
import type { Movie } from '../types'

// ─── Hero Carousel ─────────────────────────────────────────────────────────────
function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Top featured Now Playing blockbusters with backdrops
  const featured = movies.filter((m) => m.status === 'NOW_PLAYING' && m.backdropUrl).slice(0, 5)

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % (featured.length || 1))
    }, 6000)
  }

  useEffect(() => {
    if (featured.length === 0) return
    resetInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [featured.length])

  const prev = () => {
    setActiveIdx((i) => (i - 1 + featured.length) % featured.length)
    resetInterval()
  }
  const next = () => {
    setActiveIdx((i) => (i + 1) % featured.length)
    resetInterval()
  }

  if (featured.length === 0) {
    return (
      <div className="relative h-[65vh] min-h-[460px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-red-500/40 mx-auto mb-4 animate-float" />
          <h1 className="font-display font-black text-5xl text-white mb-3">FlickPass</h1>
          <p className="text-slate-400 text-lg">Your Cinema, Your Way</p>
        </div>
      </div>
    )
  }

  const current = featured[activeIdx]

  return (
    <div className="relative h-[80vh] min-h-[580px] overflow-hidden" id="hero-section">
      {/* Background images */}
      {featured.map((m, i) => (
        <div
          key={m.id}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === activeIdx ? 1 : 0 }}
        >
          <img
            src={m.backdropUrl!}
            alt={m.title}
            className="w-full h-full object-cover object-center filter brightness-95"
          />
        </div>
      ))}

      {/* Multi-layer gradient overlays for cinematic mood and readable text */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0a0a0f]/40 to-transparent" />

      {/* Hero Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-20">
        <div className="max-w-2xl animate-fade-in" key={activeIdx}>
          {/* Badge */}
          <div className="badge badge-red mb-3 inline-flex items-center gap-1.5 shadow-lg shadow-red-500/20">
            <Clapperboard className="w-3.5 h-3.5" /> Now Playing in Theaters
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-3 drop-shadow-xl">
            {current.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm font-medium">
            {current.rating && (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{current.rating.toFixed(1)}/10</span>
              </div>
            )}
            {current.durationMins > 0 && (
              <span className="text-slate-300">
                {Math.floor(current.durationMins / 60)}h {current.durationMins % 60}m
              </span>
            )}
            {current.genres && current.genres.length > 0 && (
              <span className="text-slate-400">• {current.genres.slice(0, 2).join(', ')}</span>
            )}
          </div>

          <p className="text-slate-200/90 text-sm sm:text-base line-clamp-3 mb-6 leading-relaxed max-w-xl drop-shadow">
            {current.overview}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to={`/movies/${current.id}?trailer=1`}
              className="px-6 py-3 rounded-xl glass border border-white/20 text-white hover:bg-white/10 hover:border-white/35 transition-all text-base font-semibold flex items-center gap-2.5 shadow-lg group"
              id={`hero-trailer-btn-${activeIdx}`}
            >
              <div className="w-7 h-7 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 transition-all">
                <Play className="w-3.5 h-3.5 text-red-400 group-hover:text-white fill-current ml-0.5" />
              </div>
              <span>Watch Trailer</span>
            </Link>
            <Link
              to={`/movies/${current.id}`}
              className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3 font-semibold shadow-lg shadow-red-600/30"
              id={`hero-book-btn-${activeIdx}`}
            >
              <Ticket className="w-5 h-5" />
              Book Tickets
            </Link>
          </div>
        </div>

        {/* Indicator dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIdx(i)
                resetInterval()
              }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIdx ? 'w-8 h-2 bg-red-500 shadow-md shadow-red-500/50' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg"
        aria-label="Previous movie"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg"
        aria-label="Next movie"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

// ─── Skeleton Grid ─────────────────────────────────────────────────────────────
function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden glass border border-white/5">
          <div className="skeleton aspect-[2/3]" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

const AVAILABLE_GENRES = [
  'All Genres',
  'Action',
  'Sci-Fi',
  'Adventure',
  'Drama',
  'Comedy',
  'Animation',
  'Crime',
  'Thriller',
  'Fantasy',
]

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [searchInput, setSearchInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'NOW_PLAYING' | 'UPCOMING'>('ALL')
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Live search query without requiring separate search submit button
  const { data, isLoading, isError } = useQuery({
    queryKey: ['movies', searchInput, activeCategory],
    queryFn: () =>
      moviesApi.getAll({
        search: searchInput.trim() || undefined,
        status: activeCategory === 'ALL' ? undefined : activeCategory,
        limit: 40,
      }),
  })

  let movies: Movie[] = data?.data || []

  // Client-side genre filtering if selected
  if (selectedGenre !== 'All Genres') {
    movies = movies.filter((m) =>
      m.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
    )
  }

  const activeFiltersCount =
    (activeCategory !== 'ALL' ? 1 : 0) + (selectedGenre !== 'All Genres' ? 1 : 0)

  const clearAllFilters = () => {
    setActiveCategory('ALL')
    setSelectedGenre('All Genres')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Carousel (Only shown when not actively searching) */}
      {!searchInput && !isLoading && <HeroCarousel movies={movies} />}

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ─────────────────────────────────────────────────────────────────────
            UNIFIED SEARCH & FILTER BAR:
            - Search icon positioned directly inside the search bar on the left
            - Instant real-time live search (no separate search button)
            - Clear (X) icon when text is entered
            - Filter toggle button embedded inside the search bar
            - Non-overlapping expandable filter tray (pushes content below down naturally)
           ───────────────────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="glass bg-slate-900/90 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-2xl overflow-hidden">
            {/* Search Input Row */}
            <div className="flex items-center px-4 py-2.5">
              {/* Search Icon inside the bar */}
              <div className="text-slate-400 shrink-0 mr-3 flex items-center justify-center">
                <Search className="w-5 h-5 text-slate-400" />
              </div>

              {/* Live Search Input */}
              <input
                type="text"
                placeholder="Search by title, genre, director..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-0 py-1"
                id="movie-search-input"
              />

              {/* Clear (X) button inside search bar */}
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-2 shrink-0"
                  aria-label="Clear search text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-white/15 shrink-0 mx-2" />

              {/* Filter Button directly within the search bar */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/8'
                }`}
                id="search-filter-button"
                aria-label="Toggle Filters"
              >
                <SlidersHorizontal className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">
                  {activeCategory === 'NOW_PLAYING'
                    ? 'Now Playing'
                    : activeCategory === 'UPCOMING'
                    ? 'Upcoming'
                    : selectedGenre !== 'All Genres'
                    ? selectedGenre
                    : 'Filter'}
                </span>
                {activeFiltersCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isFilterOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Non-Overlapping In-Flow Expandable Filter Tray */}
            {isFilterOpen && (
              <div className="border-t border-white/10 px-5 py-4 bg-slate-950/70 animate-fade-in">
                {/* Header with Title and Reset */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/8">
                  <span className="font-display font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" /> Quick Filter Options
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Filters
                    </button>
                  )}
                </div>

                {/* Release Category Pills */}
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Release Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeCategory === 'ALL'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'glass border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>All Movies</span>
                      {activeCategory === 'ALL' && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCategory('NOW_PLAYING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeCategory === 'NOW_PLAYING'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'glass border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Now Playing in Theaters</span>
                      {activeCategory === 'NOW_PLAYING' && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCategory('UPCOMING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeCategory === 'UPCOMING'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'glass border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-purple-300" />
                      <span>Upcoming Releases (Coming Soon)</span>
                      {activeCategory === 'UPCOMING' && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </div>
                </div>

                {/* Genre Chips */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Filter by Genre
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGenre(g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedGenre === g
                            ? 'bg-red-600 text-white shadow-sm font-semibold'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Header (Centered, no arrows) */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          {searchInput ? (
            <>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                Results for "<span className="gradient-text">{searchInput}</span>"
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Matching movies from our catalog
              </p>
              <div className="mt-3 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full glass border border-white/10 text-xs font-medium text-slate-400">
                  {movies.length} {movies.length === 1 ? 'title' : 'titles'} found
                </span>
              </div>
            </>
          ) : activeCategory === 'NOW_PLAYING' ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>In Theaters Now</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                Now Playing in Theaters
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Available for instant booking and seat selection
              </p>
              <div className="mt-3 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full glass border border-white/10 text-xs font-medium text-slate-400">
                  Showing {movies.length} {movies.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
            </>
          ) : activeCategory === 'UPCOMING' ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coming Soon</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                Upcoming Releases
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Coming soon to cinemas • Advance bookings open closer to premiere dates
              </p>
              <div className="mt-3 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full glass border border-white/10 text-xs font-medium text-slate-400">
                  Showing {movies.length} {movies.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
            </>
          ) : (
            <>
              {selectedGenre !== 'All Genres' && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-2.5">
                  <span>{selectedGenre}</span>
                </div>
              )}
              <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                {selectedGenre !== 'All Genres' ? `${selectedGenre} Movies` : 'Explore All Movies'}
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Current blockbusters and anticipated upcoming titles
              </p>
              <div className="mt-3 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full glass border border-white/10 text-xs font-medium text-slate-400">
                  Showing {movies.length} {movies.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Informational Callout when viewing Upcoming movies */}
        {activeCategory === 'UPCOMING' && (
          <div className="glass border border-purple-500/20 bg-purple-950/20 rounded-2xl p-4 sm:p-5 mb-8 flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-purple-200">
                Advance Bookings Open Closer to Release Dates
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Tickets for upcoming movies cannot be booked yet. You can explore synopses, cast details, and watch the official full HD trailers!
              </p>
            </div>
          </div>
        )}

        {/* Movie Grid */}
        {isLoading ? (
          <MovieGridSkeleton />
        ) : isError ? (
          <div className="text-center py-24 glass rounded-3xl border border-white/5 p-8">
            <Film className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-white mb-2">Backend not connected</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Please ensure the backend API is running at <code className="text-red-400">http://localhost:5000</code>.
            </p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-white/5 p-8">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg text-white mb-1">No movies found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search query or clearing filters.</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 rounded-xl btn-secondary text-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((movie, idx) => (
              <MovieCard key={movie.id} movie={movie} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
