import { useEffect, useState, useCallback } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface CountdownTimerProps {
  expiresAt: string | null
  onExpire: () => void
  className?: string
}

export default function CountdownTimer({ expiresAt, onExpire, className = '' }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const [urgent, setUrgent] = useState(false)

  const calcSeconds = useCallback(() => {
    if (!expiresAt) return 0
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    return diff
  }, [expiresAt])

  useEffect(() => {
    if (!expiresAt) return
    setSecondsLeft(calcSeconds())

    const interval = setInterval(() => {
      const s = calcSeconds()
      setSecondsLeft(s)
      setUrgent(s <= 60)
      if (s <= 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, calcSeconds, onExpire])

  if (!expiresAt || secondsLeft <= 0) return null

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const progress = Math.min(100, (secondsLeft / 300) * 100)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
        urgent
          ? 'bg-red-500/10 border-red-500/30 animate-pulse'
          : 'bg-amber-500/10 border-amber-500/20'
      } ${className}`}
    >
      {urgent ? (
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${urgent ? 'text-red-300' : 'text-amber-300'}`}>
            Seats reserved for
          </span>
          <span
            className={`font-display font-bold text-lg tabular-nums ${
              urgent ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              urgent ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
