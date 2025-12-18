import { useState, useCallback } from 'react';
import { formatCurrency } from '../utils/helpers';

const sectionTypeConfig = {
  VIP: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/30', label: 'VIP' },
  PREMIUM: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500/30', label: 'Premium' },
  STANDARD: { bg: 'bg-primary-500', text: 'text-primary-500', border: 'border-primary-500/30', label: 'Standard' },
  ECONOMY: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/30', label: 'Economy' },
  STANDING: { bg: 'bg-dark-500', text: 'text-dark-400', border: 'border-dark-500/30', label: 'Standing' },
};

const seatStatusConfig = {
  AVAILABLE: 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer hover:scale-110',
  SELECTED: 'bg-primary-500 ring-2 ring-primary-400 ring-offset-2 ring-offset-dark-900 scale-110',
  LOCKED: 'bg-amber-500 cursor-not-allowed',
  BOOKED: 'bg-dark-700 cursor-not-allowed',
  UNAVAILABLE: 'bg-dark-800 cursor-not-allowed',
};

export default function SeatMap({ sections, selectedSeats, onSeatSelect, userId }) {
  const [activeSection, setActiveSection] = useState(null);

  const handleSeatClick = useCallback((seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'UNAVAILABLE') return;
    if (seat.status === 'LOCKED' && seat.lockedBy !== userId) return;
    onSeatSelect(seat);
  }, [onSeatSelect, userId]);

  const isSelected = (seatId) => selectedSeats.some(s => s._id === seatId);

  const getSeatsByRow = (seats) => {
    const rowMap = new Map();
    seats.forEach(seat => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, []);
      }
      rowMap.get(seat.row).push(seat);
    });
    rowMap.forEach((seats) => {
      seats.sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber));
    });
    return rowMap;
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { color: 'bg-emerald-500', label: 'Available' },
            { color: 'bg-primary-500', label: 'Selected' },
            { color: 'bg-amber-500', label: 'Locked' },
            { color: 'bg-dark-700', label: 'Booked' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-sm text-dark-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="text-center">
        <div className="inline-block px-12 sm:px-20 py-3 rounded-t-2xl bg-gradient-to-b from-dark-800 to-dark-900 border border-dark-700 border-b-0">
          <span className="text-dark-500 text-sm font-medium tracking-widest uppercase">Stage</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const config = sectionTypeConfig[section.sectionType] || sectionTypeConfig.STANDARD;
          const seatsByRow = getSeatsByRow(section.seats);
          const isExpanded = activeSection === section.section || sections.length <= 3;

          return (
            <div key={section.section} className="card overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => setActiveSection(activeSection === section.section ? null : section.section)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                  <span className="font-semibold text-white">{section.section}</span>
                  <span className={`badge ${config.bg}/20 ${config.text} border ${config.border}`}>
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-dark-500 hidden sm:inline">
                    {section.stats.available} / {section.stats.total} available
                  </span>
                  <span className={config.text}>
                    {formatCurrency(section.priceRange.min)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-dark-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Seats Grid */}
              {isExpanded && (
                <div className="p-4 border-t border-dark-800 overflow-x-auto">
                  <div className="space-y-2 min-w-max">
                    {Array.from(seatsByRow.entries()).map(([row, seats]) => (
                      <div key={row} className="flex items-center gap-2">
                        <span className="w-8 text-xs text-dark-500 text-right font-mono shrink-0">
                          {row}
                        </span>
                        <div className="flex gap-1">
                          {seats.map((seat) => {
                            const selected = isSelected(seat._id);
                            const status = selected ? 'SELECTED' : seat.status;
                            const isClickable = seat.status === 'AVAILABLE' || 
                              (seat.status === 'LOCKED' && seat.lockedBy === userId);

                            return (
                              <button
                                key={seat._id}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!isClickable}
                                className={`w-7 h-7 rounded text-xs font-mono text-white transition-all duration-150 ${seatStatusConfig[status]}`}
                                title={`${section.section} - Row ${row}, Seat ${seat.seatNumber} • ${formatCurrency(seat.price)}`}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
