import { formatCurrency } from '../utils/helpers';
import Button from './Button';
import Card, { CardContent, CardFooter } from './Card';

const sectionTypeColors = {
  VIP: 'bg-amber-500',
  PREMIUM: 'bg-purple-500',
  STANDARD: 'bg-primary-500',
  ECONOMY: 'bg-emerald-500',
  STANDING: 'bg-dark-500',
};

export default function BookingSummary({
  selectedSeats,
  onRemoveSeat,
  onCheckout,
  loading,
  lockTimeRemaining,
}) {
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = Math.round(total * 0.1);
  const grandTotal = total + serviceFee;

  if (selectedSeats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800 flex items-center justify-center">
            <span className="text-3xl">🎫</span>
          </div>
          <p className="text-dark-400">
            Select seats to start your booking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-dark-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Your Selection</h3>
          <span className="badge-primary">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
          </span>
        </div>
        {lockTimeRemaining && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-amber-400">
              Reserved for {Math.floor(lockTimeRemaining / 60)}:{String(lockTimeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {selectedSeats.map((seat) => {
          const color = sectionTypeColors[seat.sectionType] || sectionTypeColors.STANDARD;
          return (
            <div
              key={seat._id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-8 rounded-full ${color}`} />
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {seat.section} • Row {seat.row} • Seat {seat.seatNumber}
                  </p>
                  <p className="text-xs text-dark-500">{seat.sectionType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-white">{formatCurrency(seat.price)}</span>
                <button
                  onClick={() => onRemoveSeat(seat)}
                  className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Subtotal</span>
            <span className="text-white">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Service Fee</span>
            <span className="text-white">{formatCurrency(serviceFee)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-dark-700">
            <span className="font-semibold text-white">Total</span>
            <span className="text-xl font-bold gradient-text">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <Button onClick={onCheckout} loading={loading} className="w-full" size="lg">
          Complete Booking
        </Button>

        <p className="text-xs text-center text-dark-500">
          By completing this booking, you agree to our terms and conditions
        </p>
      </CardFooter>
    </Card>
  );
}
