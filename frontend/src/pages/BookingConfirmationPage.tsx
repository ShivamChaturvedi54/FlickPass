import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Ticket, MapPin, Calendar, Clock, QrCode, Home, Download } from 'lucide-react'
import { bookingsApi } from '../api'
import { format } from 'date-fns'
import { useEffect, useRef } from 'react'

// ─── QR Code visual (SVG-based) ────────────────────────────────────────────────
function QRCodeDisplay({ hash }: { hash: string }) {
  // Generate a deterministic visual from the hash
  const cells = hash.split('').slice(0, 64).map((c) => parseInt(c, 16))

  return (
    <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl border border-white/8">
      <QrCode className="w-6 h-6 text-red-400" />
      <div className="bg-white p-4 rounded-xl">
        <div className="grid grid-cols-8 gap-0.5">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-sm ${
                cells[i] !== undefined && cells[i] > 7 ? 'bg-black' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-slate-600 font-mono text-center break-all max-w-[180px]">
        {hash.slice(0, 16)}...
      </p>
      <span className="badge badge-green text-xs">Valid Ticket</span>
    </div>
  )
}

// ─── Ticket card ───────────────────────────────────────────────────────────────
function TicketCard({ booking }: { booking: any }) {
  const show = booking.show
  const movie = show?.movie
  const theater = show?.theater
  const seats = booking.seats?.map((bs: any) => bs.seat) || []

  return (
    <div className="relative max-w-md mx-auto" id="ticket-card">
      {/* Ticket shape */}
      <div className="glass rounded-3xl border border-white/8 overflow-hidden">
        {/* Movie banner */}
        <div className="relative h-40">
          {movie?.backdropUrl ? (
            <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
          ) : movie?.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-900/50 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-5">
            <h2 className="font-display font-black text-2xl text-white">{movie?.title}</h2>
          </div>
          {/* Confirmed badge */}
          <div className="absolute top-4 right-4 badge badge-green">
            <CheckCircle className="w-3 h-3 mr-1" /> CONFIRMED
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative h-px bg-white/10 mx-0">
          <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#0a0a0f]" />
          <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#0a0a0f]" />
          <div className="border-t border-dashed border-white/15 mx-4" />
        </div>

        {/* Ticket details */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wider mb-1">Theater</p>
              <p className="text-white font-medium flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <span>{theater?.name}</span>
              </p>
              <p className="text-slate-500 text-xs ml-4">{theater?.location}</p>
            </div>
            <div>
              <p className="text-slate-600 text-xs uppercase tracking-wider mb-1">Date & Time</p>
              <p className="text-white font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {show && format(new Date(show.startTime), 'dd MMM yyyy')}
              </p>
              <p className="text-slate-400 text-xs flex items-center gap-1 ml-4">
                <Clock className="w-3 h-3" />
                {show && format(new Date(show.startTime), 'HH:mm')} · Screen {show?.screenNumber}
              </p>
            </div>
          </div>

          {/* Seats */}
          <div>
            <p className="text-slate-600 text-xs uppercase tracking-wider mb-2">Seats</p>
            <div className="flex flex-wrap gap-2">
              {seats.map((seat: any) => (
                <span
                  key={seat.id}
                  className={`badge ${seat.category === 'VIP' ? 'badge-amber' : 'badge-blue'}`}
                >
                  {seat.rowLabel}{seat.seatNumber}
                  {seat.category === 'VIP' && ' ★'}
                </span>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-white/8">
            <span className="text-slate-400 text-sm">Total Paid</span>
            <span className="font-display font-bold text-xl text-emerald-400">
              ₹{booking.totalAmount?.toFixed(2)}
            </span>
          </div>

          {/* Booking ID */}
          <div className="text-center">
            <p className="text-slate-600 text-xs font-mono">Booking #{booking.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const confettiShown = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!),
    enabled: !!bookingId,
  })

  const booking = data?.data

  // Simple confetti-like animation on mount
  useEffect(() => {
    if (booking && !confettiShown.current) {
      confettiShown.current = true
    }
  }, [booking])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Booking not found</h2>
          <Link to="/" className="text-red-400 text-sm">← Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="font-display font-black text-3xl text-white mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400">Your tickets are ready. Enjoy the movie! 🍿</p>
        </div>

        {/* Ticket */}
        <div className="animate-slide-up">
          <TicketCard booking={booking} />
        </div>

        {/* QR Code */}
        {booking.qrCodeHash && (
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <QRCodeDisplay hash={booking.qrCodeHash} />
            <p className="text-center text-xs text-slate-600 mt-3">
              Show this QR code at the theater entrance
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <Link to="/" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            id="download-ticket-btn"
          >
            <Download className="w-4 h-4" /> Save Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
