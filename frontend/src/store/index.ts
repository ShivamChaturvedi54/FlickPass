import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Seat, LockSeatsResponse } from '../types'

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('flickpass_token', token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('flickpass_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    { name: 'flickpass-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
)

// ─── Booking Store ────────────────────────────────────────────────────────────
interface BookingStore {
  // Selected show context
  currentShowId: string | null
  setCurrentShow: (showId: string | null) => void

  // Seat selection
  selectedSeatIds: string[]
  toggleSeat: (seatId: string) => void
  clearSelectedSeats: () => void

  // Active lock
  lockData: LockSeatsResponse | null
  lockExpiresAt: string | null
  setLockData: (data: LockSeatsResponse) => void
  clearLockData: () => void

  // Confirmed booking
  confirmedBookingId: string | null
  confirmedQrHash: string | null
  setConfirmedBooking: (id: string, qrHash: string) => void
  clearConfirmedBooking: () => void
}

export const useBookingStore = create<BookingStore>()((set) => ({
  currentShowId: null,
  setCurrentShow: (showId) => set({ currentShowId: showId }),

  selectedSeatIds: [],
  toggleSeat: (seatId) =>
    set((s) => ({
      selectedSeatIds: s.selectedSeatIds.includes(seatId)
        ? s.selectedSeatIds.filter((id) => id !== seatId)
        : s.selectedSeatIds.length < 6
        ? [...s.selectedSeatIds, seatId]
        : s.selectedSeatIds,
    })),
  clearSelectedSeats: () => set({ selectedSeatIds: [] }),

  lockData: null,
  lockExpiresAt: null,
  setLockData: (data) => set({ lockData: data, lockExpiresAt: data.lockExpiresAt }),
  clearLockData: () => set({ lockData: null, lockExpiresAt: null }),

  confirmedBookingId: null,
  confirmedQrHash: null,
  setConfirmedBooking: (id, qrHash) => set({ confirmedBookingId: id, confirmedQrHash: qrHash }),
  clearConfirmedBooking: () => set({ confirmedBookingId: null, confirmedQrHash: null }),
}))
