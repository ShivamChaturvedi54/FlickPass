import { useState } from 'react'
import { X, CreditCard, Loader2, CheckCircle, Ticket, IndianRupee, Tag, User } from 'lucide-react'
import type { LockSeatsResponse, Seat } from '../types'
import toast from 'react-hot-toast'
import { bookingsApi, authApi } from '../api'
import { useAuthStore, useBookingStore } from '../store'
import CountdownTimer from './CountdownTimer'
import { useNavigate } from 'react-router-dom'

interface OrderDrawerProps {
  open: boolean
  onClose: () => void
  lockData: LockSeatsResponse | null
  lockedSeats: Seat[]
  showId: string
  onLockExpire: () => void
}

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '₹' },
  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'wallet', label: 'Wallet', icon: '👝' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
]

export default function OrderDrawer({ open, onClose, lockData, lockedSeats, showId, onLockExpire }: OrderDrawerProps) {
  const { user } = useAuthStore()
  const { clearLockData, clearSelectedSeats, setConfirmedBooking } = useBookingStore()
  const navigate = useNavigate()
  const [selectedPayment, setSelectedPayment] = useState('upi')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [drawerAuthMode, setDrawerAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  const handleConfirm = async () => {
    if (!lockData) {
      toast.error('Seat lock expired or not found')
      return
    }

    setConfirming(true)
    try {
      let activeUserId = user?.id

      // If not logged in, authenticate or register real account
      if (!activeUserId) {
        if (!authEmail.trim() || !authPassword.trim()) {
          toast.error('Please enter your email and password to proceed')
          setConfirming(false)
          return
        }

        if (drawerAuthMode === 'signup' && !authName.trim()) {
          toast.error('Please enter your full name')
          setConfirming(false)
          return
        }

        if (drawerAuthMode === 'signup' && authPassword.length < 6) {
          toast.error('Password must be at least 6 characters')
          setConfirming(false)
          return
        }

        let authRes
        if (drawerAuthMode === 'signin') {
          authRes = await authApi.login(authEmail.trim(), authPassword)
        } else {
          authRes = await authApi.register(authName.trim(), authEmail.trim(), authPassword)
        }
        useAuthStore.getState().setAuth(authRes.data.user, authRes.data.token)
        activeUserId = authRes.data.user.id
      }
      const res = await bookingsApi.confirmBooking({
        showId,
        seatIds: lockedSeats.map((s) => s.id),
        userId: activeUserId!,
        paymentMethod: selectedPayment,
      })

      setConfirmed(true)
      setConfirmedBooking(res.data.bookingId, res.data.qrCodeHash)
      clearLockData()
      clearSelectedSeats()

      toast.success('🎉 Booking confirmed!')

      setTimeout(() => {
        navigate(`/booking/${res.data.bookingId}`)
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || 'Booking failed. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 glass-dark border-l border-white/8 flex flex-col animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-400" />
            <h2 className="font-display font-bold text-lg text-white">Order Summary</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Payment Successful!</h3>
            <p className="text-slate-400 text-sm">Redirecting to your ticket...</p>
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Countdown */}
            {lockData && (
              <div className="p-4">
                <CountdownTimer
                  expiresAt={lockData.lockExpiresAt}
                  onExpire={onLockExpire}
                />
              </div>
            )}

            {/* Seats selected */}
            <div className="px-5 py-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Selected Seats</h3>
              <div className="flex flex-wrap gap-2">
                {lockedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`badge text-xs ${seat.category === 'VIP' ? 'badge-amber' : 'badge-blue'}`}
                  >
                    {seat.rowLabel}{seat.seatNumber}
                    <span className="ml-1 opacity-60">{seat.category === 'VIP' ? '★' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            {lockData && (
              <div className="px-5 py-3 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  {lockData.pricing.standardSeats > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Standard × {lockData.pricing.standardSeats}</span>
                      <span className="flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {(lockData.pricing.standardPrice * lockData.pricing.standardSeats).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {lockData.pricing.vipSeats > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>VIP ★ × {lockData.pricing.vipSeats}</span>
                      <span className="flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {(lockData.pricing.vipPrice * lockData.pricing.vipSeats).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Booking fee (2%)</span>
                    <span className="flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {lockData.pricing.bookingFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <IndianRupee className="w-4 h-4" />
                      {lockData.pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* User Account / Auth Section */}
            {!user ? (
              <div className="px-5 py-3.5 border-t border-white/10 bg-slate-950/50">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-red-500" />
                    {drawerAuthMode === 'signin' ? 'Sign In to Proceed' : 'Sign Up to Proceed'}
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDrawerAuthMode('signin')}
                      className={`font-semibold pb-0.5 transition-colors ${
                        drawerAuthMode === 'signin'
                          ? 'text-red-400 border-b border-red-500'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setDrawerAuthMode('signup')}
                      className={`font-semibold pb-0.5 transition-colors ${
                        drawerAuthMode === 'signup'
                          ? 'text-red-400 border-b border-red-500'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {drawerAuthMode === 'signup' && (
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="input-field py-1.5 text-xs"
                      required
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="input-field py-1.5 text-xs"
                    required
                  />
                  <input
                    type="password"
                    placeholder={drawerAuthMode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="input-field py-1.5 text-xs"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="px-5 py-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-300 bg-white/2">
                <span className="text-slate-400">Booking as:</span>
                <span className="font-semibold text-white flex items-center gap-1.5 truncate max-w-[200px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  {user.name}
                </span>
              </div>
            )}

            {/* Payment method */}
            <div className="px-5 py-3 border-t border-white/5 flex-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-3 rounded-xl border text-left transition-all text-sm ${
                      selectedPayment === method.id
                        ? 'border-red-500/50 bg-red-500/10 text-white'
                        : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                    <div className="font-medium text-xs">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-5 border-t border-white/8">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
                id="confirm-pay-btn"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Confirm & Pay
                    {lockData && (
                      <span className="ml-auto badge badge-green text-xs py-0.5">
                        ₹{lockData.pricing.total.toFixed(0)}
                      </span>
                    )}
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-600 text-center mt-2">
                🔒 Secured by 256-bit encryption
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
