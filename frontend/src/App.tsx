import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import MovieDetailPage from './pages/MovieDetailPage'
import SeatSelectorPage from './pages/SeatSelectorPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/seats/:showId" element={<SeatSelectorPage />} />
          <Route path="/booking/:bookingId" element={<BookingConfirmationPage />} />
          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
                <div className="font-display font-black text-8xl text-red-500/20 mb-4">404</div>
                <h1 className="font-display font-bold text-2xl text-white mb-2">Page Not Found</h1>
                <p className="text-slate-400 mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary">← Back to Movies</a>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
