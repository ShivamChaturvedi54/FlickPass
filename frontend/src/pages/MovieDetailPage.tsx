import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowLeft, Star, Clock, Calendar, Globe, Film,
  MapPin, ChevronRight, User, Clapperboard, Sparkles, AlertCircle, Play
} from 'lucide-react'
import { moviesApi } from '../api'
import MoviePoster from '../components/MoviePoster'
import { TrailerButton } from '../components/TrailerModal'
import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from 'date-fns'
import type { Movie, TheaterShows, Show } from '../types'

// ─── Date Selector Pill ────────────────────────────────────────────────────────
function DatePill({ date, selected, onClick }: { date: Date; selected: boolean; onClick: () => void }) {
  const label = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE d MMM')
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        selected
          ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
          : 'glass border border-white/8 text-slate-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Show Time Pill ────────────────────────────────────────────────────────────
function ShowTimePill({ show, movieId }: { show: Show; movieId: string }) {
  const navigate = useNavigate()
  const isPast = isBefore(new Date(show.startTime), new Date())

  return (
    <button
      onClick={() => !isPast && navigate(`/seats/${show.id}?movieId=${movieId}`)}
      disabled={isPast}
      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 min-w-[95px] ${
        isPast
          ? 'border-white/5 text-slate-700 cursor-not-allowed'
          : 'glass border-white/10 text-slate-200 hover:border-red-500/50 hover:text-white hover:bg-red-500/10 cursor-pointer shadow-md'
      }`}
      id={`show-time-${show.id}`}
    >
      <span className="font-bold font-display text-base">{format(new Date(show.startTime), 'HH:mm')}</span>
      <span className="text-xs text-slate-400">Screen {show.screenNumber}</span>
      <span className="text-[11px] text-red-400 font-semibold mt-0.5">₹{show.priceStandard}</span>
    </button>
  )
}

// ─── Cast Card ─────────────────────────────────────────────────────────────────
function CastCard({ member }: { member: { id: number; name: string; character: string; profileUrl?: string | null } }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="flex flex-col items-center text-center shrink-0 w-24">
      <div className="w-20 h-20 rounded-full overflow-hidden mb-2.5 bg-slate-800 border-2 border-white/10 shadow-lg">
        {member.profileUrl && !imgErr ? (
          <img
            src={member.profileUrl}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <User className="w-8 h-8 text-slate-500" />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2">{member.name}</p>
      <p className="text-[11px] text-slate-400 leading-tight line-clamp-1 mt-0.5">{member.character}</p>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16">
      <div className="skeleton h-[520px] w-full mb-8" />
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const autoPlayTrailer = searchParams.get('trailer') === '1'
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.getById(id!),
    enabled: !!id,
  })

  const movie: Movie | undefined = data?.data
  const isUpcoming = movie?.status === 'UPCOMING'

  // Build date options (next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  if (isLoading) return <MovieDetailSkeleton />

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-white mb-2">Movie not found</h2>
          <Link to="/" className="text-red-400 hover:text-red-300 text-sm">← Back to movies</Link>
        </div>
      </div>
    )
  }

  // Filter shows by selected date
  const filteredTheaterShows = (movie.showsByTheater || []).map((ts: TheaterShows) => ({
    ...ts,
    shows: ts.shows.filter((s) => format(new Date(s.startTime), 'yyyy-MM-dd') === selectedDate),
  })).filter((ts) => ts.shows.length > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ─────────────────────────────────────────────────────────────────────────
          IMMERSIVE HERO HEADER:
          The backdrop image is positioned right behind all header text with transparent
          cinematic overlays.
         ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[580px] lg:min-h-[660px] flex items-end overflow-hidden pt-24 pb-14 border-b border-white/5">
        {/* Full Backdrop Background Image */}
        <div className="absolute inset-0 z-0">
          {movie.backdropUrl ? (
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover object-center filter brightness-90 transform scale-105 transition-transform duration-1000 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a0a0f]" />
          )}

          {/* Transparent cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0a0a0f]/75 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
        </div>

        {/* Back navigation button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 sm:left-8 z-30 glass rounded-full p-2.5 hover:bg-white/10 transition-colors shadow-2xl"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Content positioned directly over the background image */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Movie Poster */}
            <div className="shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-slate-900">
              <MoviePoster
                posterUrl={movie.posterUrl}
                title={movie.title}
                className="w-48 sm:w-60 shadow-2xl"
              />
            </div>

            {/* Movie Details over background */}
            <div className="flex-1 min-w-0">
              {/* Status Badge */}
              {isUpcoming ? (
                <div className="badge bg-purple-600/90 text-white font-semibold mb-3 inline-flex items-center gap-1.5 shadow-lg shadow-purple-500/20 text-xs py-1 px-3 border border-purple-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" /> Upcoming Release • Coming Soon
                </div>
              ) : (
                <div className="badge badge-red mb-3 inline-flex items-center gap-1.5 shadow-lg shadow-red-500/20 text-xs py-1 px-3">
                  <Clapperboard className="w-3.5 h-3.5" /> Now Playing in Theaters
                </div>
              )}

              {/* Title */}
              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white leading-tight mb-3 drop-shadow-lg">
                {movie.title}
              </h1>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm text-slate-300 mb-4 font-medium">
                {movie.rating && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/25">
                    <Star className="w-4 h-4 fill-current" />
                    {movie.rating.toFixed(1)}/10
                  </span>
                )}
                {movie.durationMins > 0 && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-red-400" />
                    {Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m
                  </span>
                )}
                {movie.releaseDate && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-4 h-4 text-red-400" />
                    {format(parseISO(movie.releaseDate), 'dd MMM yyyy')}
                  </span>
                )}
                {movie.language && (
                  <span className="flex items-center gap-1.5 uppercase font-semibold text-xs px-2.5 py-1 rounded bg-white/10 text-slate-200 border border-white/10">
                    <Globe className="w-3.5 h-3.5 text-red-400" />
                    {movie.language}
                  </span>
                )}
                {movie.director && movie.director !== 'Unknown' && (
                  <span className="text-slate-400">
                    Dir. <strong className="text-white font-semibold">{movie.director}</strong>
                  </span>
                )}
              </div>

              {/* Overview */}
              <p className="text-slate-200/90 leading-relaxed text-sm sm:text-base max-w-2xl mb-6 font-normal drop-shadow">
                {movie.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap pt-1">
                <TrailerButton
                  trailerUrl={movie.trailerUrl}
                  movieTitle={movie.title}
                  initialOpen={autoPlayTrailer}
                />

                {isUpcoming ? (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-sm font-semibold shadow-lg backdrop-blur-md">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    {movie.releaseDate
                      ? `Releases ${format(parseISO(movie.releaseDate), 'dd MMMM yyyy')}`
                      : 'Releases Soon'}{' '}
                    • Bookings Open Soon
                  </div>
                ) : (
                  <a
                    href="#showtimes"
                    className="btn-primary flex items-center gap-2 text-base px-6 py-3 font-semibold shadow-lg shadow-red-600/30"
                  >
                    <Film className="w-5 h-5" /> Book Tickets
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          CAST SECTION
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {movie.cast && movie.cast.length > 0 && (
          <div className="mb-14">
            <h2 className="font-display font-bold text-2xl text-white mb-6 flex items-center gap-2.5">
              <User className="w-5 h-5 text-red-400" /> Top Cast
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {movie.cast.map((member) => (
                <CastCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────
            SHOWTIMES OR UPCOMING SHOWCASE
           ───────────────────────────────────────────────────────────────────────── */}
        <div id="showtimes" className="pt-2">
          {isUpcoming ? (
            /* Upcoming Movie Notice (Cannot be booked) */
            <div className="glass rounded-3xl p-8 sm:p-12 border border-purple-500/20 bg-purple-950/10 text-center max-w-3xl mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              <span className="badge bg-purple-600/30 text-purple-300 font-semibold text-xs px-3 py-1 border border-purple-500/40 mb-3 inline-block">
                Upcoming Theatrical Release
              </span>

              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">
                Advance Bookings Open Soon
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
                <strong>{movie.title}</strong> is slated for theatrical release on{' '}
                <span className="text-purple-300 font-semibold">
                  {movie.releaseDate
                    ? format(parseISO(movie.releaseDate), 'EEEE, MMMM d, yyyy')
                    : 'an upcoming date'}
                </span>
                . Ticket reservations and cinema showtimes will go live closer to the premiere date.
              </p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  to="/"
                  className="px-6 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 hover:text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-lg"
                >
                  <Film className="w-4 h-4 text-purple-400" />
                  Browse Movies in Theaters
                </Link>
              </div>
            </div>
          ) : (
            /* Now Playing: Theaters & Showtimes */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-red-400" /> Available Showtimes
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Select a showtime to proceed to seat selection</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">Pick a date below:</span>
              </div>

              {/* Date Selector Pills */}
              <div className="flex gap-2.5 overflow-x-auto pb-3 mb-8 scrollbar-hide">
                {dateOptions.map((d) => (
                  <DatePill
                    key={d.toISOString()}
                    date={d}
                    selected={format(d, 'yyyy-MM-dd') === selectedDate}
                    onClick={() => setSelectedDate(format(d, 'yyyy-MM-dd'))}
                  />
                ))}
              </div>

              {/* Theaters List */}
              {filteredTheaterShows.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-white/5">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-display font-semibold text-white text-lg mb-1">
                    No shows scheduled for {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                  </h3>
                  <p className="text-slate-400 text-sm">Please pick another date above to view showtimes.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredTheaterShows.map(({ theater, shows }) => (
                    <div
                      key={theater.id}
                      className="glass rounded-2xl p-6 border border-white/8 hover:border-white/15 transition-colors shadow-lg"
                    >
                      {/* Theater Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-white/5">
                        <div>
                          <h3 className="font-display font-bold text-lg text-white">{theater.name}</h3>
                          <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            {theater.location} • {theater.totalScreens} Screens
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 font-medium px-3 py-1 rounded-full bg-white/5 border border-white/5 w-fit">
                          M-Ticket • Food & Beverage Available
                        </span>
                      </div>

                      {/* Showtimes Pills */}
                      <div className="flex flex-wrap gap-3">
                        {shows.map((show) => (
                          <ShowTimePill key={show.id} show={show} movieId={movie.id} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
