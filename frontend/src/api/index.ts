import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flickpass_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response unwrapper
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  }
)

// ─── Movies ───────────────────────────────────────────────────────────────────
export const moviesApi = {
  getAll: (params?: { search?: string; status?: 'NOW_PLAYING' | 'UPCOMING'; page?: number; limit?: number }) =>
    api.get('/movies', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/movies/${id}`).then((r) => r.data),
}

// ─── Shows ────────────────────────────────────────────────────────────────────
export const showsApi = {
  getById: (id: string) =>
    api.get(`/shows/${id}`).then((r) => r.data),

  getSeats: (showId: string, userId?: string) =>
    api.get(`/shows/${showId}/seats`, { params: { userId } }).then((r) => r.data),
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  lockSeats: (payload: { showId: string; seatIds: string[]; userId: string }) =>
    api.post('/bookings/lock-seats', payload).then((r) => r.data),

  confirmBooking: (payload: {
    showId: string
    seatIds: string[]
    userId: string
    paymentMethod?: string
  }) => api.post('/bookings/confirm', payload).then((r) => r.data),

  releaseSeats: (payload: { showId: string; seatIds: string[] }) =>
    api.post('/bookings/release-seats', payload).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/bookings/${id}`).then((r) => r.data),

  getUserBookings: (userId: string) =>
    api.get(`/bookings/user/${userId}`).then((r) => r.data),
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }).then((r) => r.data),

  demoLogin: () =>
    api.post('/auth/demo-login').then((r) => r.data),
}

export default api
