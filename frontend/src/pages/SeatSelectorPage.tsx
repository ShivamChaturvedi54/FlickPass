import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import {
  ArrowLeft, Ticket, Users, ShoppingCart, Loader2,
  Film, Clock, MapPin, Calendar
} from 'lucide-react'
import { showsApi, bookingsApi } from '../api'
import SeatGrid from '../components/SeatGrid'
import OrderDrawer from '../components/OrderDrawer'
import CountdownTimer from '../components/CountdownTimer'
import { useAuthStore, useBookingStore } from '../store'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Seat } from '../types'

export default function SeatSelectorPage() {
  const { showId } = useParams<{ showId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { user } = useAuthStore()
  const {
    selectedSeatIds, toggleSeat, clearSelectedSeats,
    lockData, lockExpiresAt, setLockData, clearLockData
  } = useBookingStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [locking, setLocking] = useState(false)

  const isLocked = !!lockData

  // Fetch seat layout, poll every 10s to stay fresh
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seats', showId, user?.id],
    queryFn: () => showsApi.getSeats(showId!, user?.id),
    enabled: !!showId,
    refetchInterval: 10000,
  })

  const seatsData = data?.data
  const show = seatsData?.show
  const lockedSeats: Seat[] = seatsData?.seats?.filter(
    (s: Seat) => selectedSeatIds.includes(s.id)
  ) || []

  const handleToggle = useCallback(
    (seatId: string) => {
      if (isLocked) return
      if (selectedSeatIds.length >= 6 && !selectedSeatIds.includes(seatId)) {
        toast.error('Maximum 6 seats per booking')
        return
      }
      toggleSeat(seatId)
    },
    [toggleSeat, selectedSeatIds, isLocked]
  )

  const handleLockSeats = async () => {
    if (!user) {
      toast.error('Please log in first — use "Demo Login" in the navbar')
      return
    }
    if (selectedSeatIds.length === 0) {
      toast.error('Select at least one seat')
      return
    }

    setLocking(true)
    try {
      const res = await bookingsApi.lockSeats({
        showId: showId!,
        seatIds: selectedSeatIds,
        userId: user.id,
      })
      setLockData(res.data)
      setDrawerOpen(true)
      toast.success(`🎟️ ${selectedSeatIds.length} seat${selectedSeatIds.length > 1 ? 's' : ''} locked for 5 minutes!`)
      // Refetch to show "SELECTED" status
      queryClient.invalidateQueries({ queryKey: ['seats', showId] })
    } catch (err: any) {
      toast.error(err.message || 'Could not lock seats')
    } finally {
      setLocking(false)
    }
  }

  const handleLockExpire = useCallback(async () => {
    toast.error('⏰ Seat lock expired! Please select again.', { duration: 5000 })
    clearLockData()
    clearSelectedSeats()
    setDrawerOpen(false)
    // Release Redis locks
    if (showId && selectedSeatIds.length > 0) {
      await bookingsApi.releaseSeats({ showId, seatIds: selectedSeatIds })
    }
    queryClient.invalidateQueries({ queryKey: ['seats', showId] })
  }, [clearLockData, clearSelectedSeats, showId, selectedSeatIds, queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading seat layout...</p>
        </div>
      </div>
    )
  }

  if (isError || !seatsData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Show not found</h2>
          <button onClick={() => navigate(-1)} className="text-red-400 text-sm">← Go back</button>
        </div>
      </div>
    )
  }

  const { seatsByRow, stats } = seatsData

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-32">
      {/* Header bar */}
      <div className="sticky top-16 z-30 glass-dark border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {show && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-white text-sm sm:text-base truncate">
                  {show.movie?.title}
                </span>
                <span className="text-slate-600 hidden sm:block">·</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {show.theater?.name}
                </span>
                <span className="text-slate-600 hidden sm:block">·</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(show.startTime), 'EEE d MMM, HH:mm')}
                </span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs">
            <span className="text-slate-500">{stats.available} seats left</span>
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <Users className="w-3.5 h-3.5" />
              {selectedSeatIds.length} selected
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Active lock timer */}
        {isLocked && lockExpiresAt && (
          <div className="mb-6">
            <CountdownTimer expiresAt={lockExpiresAt} onExpire={handleLockExpire} />
          </div>
        )}

        {/* Seat grid */}
        <SeatGrid
          seatsByRow={seatsByRow}
          selectedSeatIds={selectedSeatIds}
          onToggle={handleToggle}
          isLocked={isLocked}
        />

        {/* Stats footer */}
        <div className="mt-6 glass rounded-xl border border-white/5 p-4 grid grid-cols-4 gap-4 text-center text-xs">
          {[
            { label: 'Available', val: stats.available, color: 'text-slate-400' },
            { label: 'Selected', val: stats.selected + selectedSeatIds.length, color: 'text-emerald-400' },
            { label: 'Held', val: stats.lockedTemporary, color: 'text-amber-400' },
            { label: 'Booked', val: stats.booked, color: 'text-red-400' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div className={`font-display font-bold text-xl ${color}`}>{val}</div>
              <div className="text-slate-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      {selectedSeatIds.length > 0 && !isLocked && (
        <div className="fixed bottom-0 left-0 right-0 z-30 glass-dark border-t border-white/8 px-4 py-4 animate-slide-up">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="flex-1 text-sm text-slate-300">
              <span className="font-bold text-white">{selectedSeatIds.length} seat{selectedSeatIds.length > 1 ? 's' : ''}</span> selected
              <span className="text-slate-600 ml-2 text-xs">Max 6</span>
            </div>
            <button
              onClick={handleLockSeats}
              disabled={locking}
              className="btn-primary flex items-center gap-2 shrink-0"
              id="lock-seats-btn"
            >
              {locking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {locking ? 'Locking...' : 'Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* Reopen drawer if locked */}
      {isLocked && !drawerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 glass-dark border-t border-white/8 px-4 py-4 animate-slide-up">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" /> View Order Summary
            </button>
          </div>
        </div>
      )}

      {/* Order drawer */}
      <OrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lockData={lockData}
        lockedSeats={lockedSeats.length > 0 ? lockedSeats : seatsData.seats?.filter((s: Seat) => selectedSeatIds.includes(s.id)) || []}
        showId={showId!}
        onLockExpire={handleLockExpire}
      />
    </div>
  )
}
