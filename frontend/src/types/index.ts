export interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  durationMins: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  rating: number | null;
  language: string | null;
  status: 'NOW_PLAYING' | 'UPCOMING';
  cast?: CastMember[];
  director?: string;
  trailerUrl?: string | null;
  showsByTheater?: TheaterShows[];
  _count?: { shows: number };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  totalScreens: number;
}

export interface Show {
  id: string;
  movieId: string;
  theaterId: string;
  screenNumber: number;
  startTime: string;
  endTime: string;
  priceStandard: number;
  priceVip: number;
  isActive: boolean;
  movie?: Movie;
  theater?: Theater;
  _count?: { seats: number };
}

export interface TheaterShows {
  theater: Theater;
  shows: Show[];
}

export interface Seat {
  id: string;
  showId: string;
  rowLabel: string;
  seatNumber: number;
  category: 'STANDARD' | 'VIP';
  isReserved: boolean;
  status: 'AVAILABLE' | 'SELECTED' | 'LOCKED_TEMPORARY' | 'BOOKED';
  lockedBy: string | null;
}

export interface SeatsByRow {
  [row: string]: Seat[];
}

export interface SeatsData {
  show: Show;
  seatsByRow: SeatsByRow;
  seats: Seat[];
  stats: {
    total: number;
    available: number;
    booked: number;
    lockedTemporary: number;
    selected: number;
  };
  lockExpiresAt: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  showId: string;
  totalAmount: number;
  status: 'LOCKED' | 'CONFIRMED' | 'CANCELLED';
  qrCodeHash: string | null;
  createdAt: string;
  show?: Show;
  seats?: { seat: Seat }[];
}

export interface LockSeatsResponse {
  showId: string;
  lockedSeats: Seat[];
  pricing: {
    standardSeats: number;
    vipSeats: number;
    standardPrice: number;
    vipPrice: number;
    subtotal: number;
    bookingFee: number;
    total: number;
  };
  lockExpiresAt: string;
  ttlSeconds: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
