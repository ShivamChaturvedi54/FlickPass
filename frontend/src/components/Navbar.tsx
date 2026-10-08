import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  Ticket, MapPin, ChevronDown, User, LogOut, Check,
  Sparkles, Clapperboard, X, Film, QrCode, Lock, Mail, Eye, EyeOff
} from 'lucide-react'
import { useAuthStore } from '../store'
import { authApi, bookingsApi } from '../api'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const userDropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real Authentication: Sign In & Sign Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim() || !passwordInput.trim()) {
      toast.error('Please enter email and password')
      return
    }

    if (authMode === 'signup' && !nameInput.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (authMode === 'signup' && passwordInput.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setAuthLoading(true)
    try {
      if (authMode === 'signin') {
        const res = await authApi.login(emailInput.trim(), passwordInput)
        setAuth(res.data.user, res.data.token)
        toast.success(`Welcome back, ${res.data.user.name}! 🎬`)
      } else {
        const res = await authApi.register(nameInput.trim(), emailInput.trim(), passwordInput)
        setAuth(res.data.user, res.data.token)
        toast.success(`Account created! Welcome, ${res.data.user.name}! 🍿`)
      }
      setAuthModalOpen(false)
      setNameInput('')
      setEmailInput('')
      setPasswordInput('')
    } catch (err: any) {
      toast.error(err.message || (authMode === 'signin' ? 'Sign in failed' : 'Registration failed'))
    } finally {
      setAuthLoading(false)
    }
  }

  // Demo Login Handler
  const handleDemoLogin = async () => {
    setAuthLoading(true)
    try {
      const res = await authApi.demoLogin()
      setAuth(res.data.user, res.data.token)
      toast.success(`Welcome back, ${res.data.user.name}! 🎬`)
      setAuthModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Demo login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch user bookings when Tickets Modal opens
  const openTicketsModal = async () => {
    setTicketsModalOpen(true)
    setUserMenuOpen(false)
    if (user?.id) {
      setLoadingBookings(true)
      try {
        const res = await bookingsApi.getUserBookings(user.id)
        setUserBookings(res.data || [])
      } catch (e) {
        setUserBookings([])
      } finally {
        setLoadingBookings(false)
      }
    }
  }

  // Smooth scroll helper
  const scrollToMovies = () => {
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: window.innerHeight * 0.75, behavior: 'smooth' })
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* ─── LEFT: FlickPass Brand Logo ──────────────────────────────── */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group select-none shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform shrink-0">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-black text-lg sm:text-xl text-white tracking-tight shrink-0">
                Flick<span className="text-red-500">Pass</span>
              </span>
            </Link>

            {/* ─── RIGHT: My Tickets & Account ─────────────────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* My Tickets Button */}
              <button
                onClick={openTicketsModal}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 hover:border-red-500/60 text-xs font-semibold text-white transition-all shadow-md shadow-red-600/20 active:scale-95 shrink-0"
                aria-label="View My Tickets"
                id="nav-my-tickets-btn"
              >
                <Ticket className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>My Tickets</span>
              </button>

              {/* User Account Menu (if authenticated) */}
              {isAuthenticated && user ? (
                <div className="relative shrink-0" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-full glass border border-white/10 hover:border-white/25 text-xs text-slate-200 transition-all shadow-sm shrink-0"
                    aria-label="User Account"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white text-[11px] shadow shrink-0">
                      {user.name[0].toUpperCase()}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-56 glass bg-slate-900/95 border border-white/15 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in backdrop-blur-2xl">
                      <div className="px-3 py-2 border-b border-white/8 mb-2">
                        <p className="font-semibold text-xs text-white">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={openTicketsModal}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5 text-red-400" /> My Bookings
                        </button>

                        <button
                          onClick={() => {
                            logout()
                            setUserMenuOpen(false)
                            toast.success('Signed out')
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDemoLogin}
                    disabled={authLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-xs font-semibold text-amber-300 transition-all active:scale-95 shrink-0"
                    id="nav-demo-login-btn"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Demo Login</span>
                    <span className="sm:hidden">Demo</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signin')
                      setAuthModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all shadow-md shadow-red-600/30 active:scale-95 shrink-0"
                    id="nav-sign-in-btn"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MODAL: Real Sign In / Sign Up ──────────────────────────────────── */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Ticket className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-display font-black text-2xl text-white">
                {authMode === 'signin' ? 'Sign In to FlickPass' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'signin'
                  ? 'Access your tickets, fast seat checkout, and confirmed passes'
                  : 'Join FlickPass to book seats and reserve upcoming cinema tickets'}
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="input-field input-with-icon text-sm"
                      style={{ paddingLeft: '44px' }}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field input-with-icon text-sm"
                    style={{ paddingLeft: '44px' }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={authMode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    className="input-field input-with-icon input-with-icon-right text-sm"
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full btn-primary py-3 text-sm font-semibold mt-3 shadow-lg shadow-red-600/30"
              >
                {authLoading
                  ? authMode === 'signin'
                    ? 'Signing In...'
                    : 'Creating Account...'
                  : authMode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>

              {/* Quick 1-Click Demo Login */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mt-2 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Demo Login (No password needed)</span>
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              {authMode === 'signin' ? (
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-red-400 hover:text-red-300 font-semibold transition-colors ml-1"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-red-400 hover:text-red-300 font-semibold transition-colors ml-1"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: My Tickets & Active Bookings ──────────────────────────────── */}
      {ticketsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setTicketsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/8 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">My Movie Tickets</h3>
                  <p className="text-xs text-slate-400">View and access your confirmed cinema tickets</p>
                </div>
              </div>
              <button
                onClick={() => setTicketsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bookings List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loadingBookings ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
                  Loading your tickets...
                </div>
              ) : !isAuthenticated ? (
                <div className="py-10 text-center glass rounded-2xl p-6 border border-white/5">
                  <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-white text-sm mb-1">Sign In to View Tickets</h4>
                  <p className="text-xs text-slate-400 mb-4">Your confirmed bookings will appear right here.</p>
                  <button
                    onClick={() => {
                      setTicketsModalOpen(false)
                      setAuthModalOpen(true)
                    }}
                    className="btn-primary py-2 px-5 text-xs font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              ) : userBookings.length === 0 ? (
                <div className="py-10 text-center glass rounded-2xl p-6 border border-white/5">
                  <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-white text-sm mb-1">No Tickets Yet</h4>
                  <p className="text-xs text-slate-400 mb-4">You haven't booked any movies yet.</p>
                  <button
                    onClick={() => {
                      setTicketsModalOpen(false)
                      scrollToMovies()
                    }}
                    className="btn-primary py-2 px-5 text-xs font-semibold"
                  >
                    Browse Movies in Theaters
                  </button>
                </div>
              ) : (
                userBookings.map((b) => (
                  <div
                    key={b.id}
                    className="glass rounded-2xl p-4 border border-white/8 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="badge badge-green text-[10px] py-0.5 px-2 mb-1.5 inline-block">
                        Confirmed
                      </span>
                      <h4 className="font-bold text-sm text-white truncate">
                        {b.show?.movie?.title || 'Movie Booking'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.show?.theater?.name} • ₹{b.totalAmount}
                      </p>
                    </div>

                    <Link
                      to={`/booking/${b.id}`}
                      onClick={() => setTicketsModalOpen(false)}
                      className="btn-secondary py-1.5 px-3 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 text-red-400" />
                      <span>View Ticket</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
