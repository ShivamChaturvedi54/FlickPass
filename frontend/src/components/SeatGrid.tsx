import { useCallback } from 'react'
import type { Seat, SeatsByRow } from '../types'

interface SeatGridProps {
  seatsByRow: SeatsByRow
  selectedSeatIds: string[]
  onToggle: (seatId: string) => void
  isLocked: boolean // after lock-seats is confirmed
  disabled?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'seat seat-available cursor-pointer',
  SELECTED: 'seat seat-selected cursor-pointer',
  LOCKED_TEMPORARY: 'seat seat-locked cursor-not-allowed',
  BOOKED: 'seat seat-booked cursor-not-allowed',
}

const STATUS_TITLE: Record<string, string> = {
  AVAILABLE: 'Available — click to select',
  SELECTED: 'Selected by you',
  LOCKED_TEMPORARY: 'Temporarily held by another user',
  BOOKED: 'Already booked',
}

function SeatButton({ seat, selected, onToggle, disabled }: {
  seat: Seat
  selected: boolean
  onToggle: (id: string) => void
  disabled: boolean
}) {
  const effectiveStatus = selected ? 'SELECTED' : seat.status
  const clickable = !disabled && (effectiveStatus === 'AVAILABLE' || effectiveStatus === 'SELECTED')
  const isVip = seat.category === 'VIP'

  return (
    <button
      key={seat.id}
      onClick={() => clickable && onToggle(seat.id)}
      className={`${STATUS_STYLES[effectiveStatus]} ${isVip ? 'seat-vip' : ''}`}
      title={`${seat.rowLabel}${seat.seatNumber} — ${STATUS_TITLE[effectiveStatus]}`}
      disabled={!clickable}
      aria-label={`Seat ${seat.rowLabel}${seat.seatNumber}`}
    >
      <span className="text-[9px] font-bold leading-none select-none">
        {seat.seatNumber}
      </span>
    </button>
  )
}

export default function SeatGrid({ seatsByRow, selectedSeatIds, onToggle, isLocked, disabled = false }: SeatGridProps) {
  const rows = Object.keys(seatsByRow).sort()
  const isSelected = useCallback((id: string) => selectedSeatIds.includes(id), [selectedSeatIds])

  return (
    <div className="w-full">
      {/* Screen arc */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="relative w-4/5 max-w-sm h-12 border-t-2 border-x-2 border-red-500/40 rounded-t-[50%]"
          style={{ boxShadow: '0 -8px 30px rgba(229,9,20,0.15)' }}
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-[0.2em] text-red-400/70 uppercase bg-slate-950 px-3">
            Screen this way
          </span>
        </div>
        <div className="mt-1 w-2/3 max-w-xs h-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent rounded-full blur-sm" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-xs text-slate-400">
        {[
          { label: 'Available', cls: 'bg-slate-600 rounded-md' },
          { label: 'Selected', cls: 'bg-emerald-500 rounded-md' },
          { label: 'Held by Other', cls: 'bg-amber-500 rounded-md' },
          { label: 'Booked', cls: 'bg-red-500 rounded-md opacity-60' },
          { label: 'VIP', cls: 'bg-slate-600 border-t-2 border-amber-400/60 rounded-md' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-6 h-5 ${cls}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* VIP label */}
      {rows.some((r) => seatsByRow[r][0]?.category === 'VIP') && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <span className="text-[10px] font-bold tracking-widest text-amber-500/60 uppercase">VIP Section</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        </div>
      )}

      {/* Seat grid */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-flex flex-col gap-2 min-w-max mx-auto px-2">
          {rows.map((row) => {
            const seats = seatsByRow[row]
            const isVipRow = seats[0]?.category === 'VIP'
            const showDivider = row === 'E' // Standard starts at E

            return (
              <div key={row}>
                {showDivider && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                    <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Standard</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {/* Row label */}
                  <span className={`w-6 text-center text-xs font-bold shrink-0 ${isVipRow ? 'text-amber-500/60' : 'text-slate-600'}`}>
                    {row}
                  </span>

                  {/* Left block */}
                  <div className="flex gap-1">
                    {seats.slice(0, Math.ceil(seats.length / 2)).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        selected={isSelected(seat.id)}
                        onToggle={onToggle}
                        disabled={disabled || isLocked}
                      />
                    ))}
                  </div>

                  {/* Aisle gap */}
                  <div className="w-6" />

                  {/* Right block */}
                  <div className="flex gap-1">
                    {seats.slice(Math.ceil(seats.length / 2)).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        selected={isSelected(seat.id)}
                        onToggle={onToggle}
                        disabled={disabled || isLocked}
                      />
                    ))}
                  </div>

                  {/* Row label right */}
                  <span className={`w-6 text-center text-xs font-bold shrink-0 ${isVipRow ? 'text-amber-500/60' : 'text-slate-600'}`}>
                    {row}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
