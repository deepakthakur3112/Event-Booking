import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, seatsApi, bookingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import BookingSummary from '../components/BookingSummary';
import { PageLoader } from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { formatDate, formatTime, getCategoryIcon, generateIdempotencyKey, formatCurrency } from '../utils/helpers';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Fetch event and seats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [eventRes, seatsRes] = await Promise.all([
          eventsApi.getEventById(id),
          eventsApi.getEventSeats(id),
        ]);
        setEvent(eventRes.data);
        setSeatData(seatsRes.data);
      } catch (err) {
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setLockTimeRemaining(null);
      return;
    }

    const lockDuration = 300;
    setLockTimeRemaining(lockDuration);

    const interval = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1) {
          handleReleaseAllSeats();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats.length > 0]);

  const refreshSeats = async () => {
    try {
      const { data } = await eventsApi.getEventSeats(id);
      setSeatData(data);
    } catch (err) {
      console.error('Failed to refresh seats:', err);
    }
  };

  const handleSeatSelect = useCallback(async (seat) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    const isSelected = selectedSeats.some(s => s._id === seat._id);

    if (isSelected) {
      try {
        await seatsApi.releaseSeat(id, seat._id);
        setSelectedSeats(prev => prev.filter(s => s._id !== seat._id));
        await refreshSeats();
      } catch (err) {
        setError('Failed to release seat: ' + err.message);
      }
    } else {
      if (selectedSeats.length >= 10) {
        setError('Maximum 10 seats per booking');
        return;
      }

      try {
        await seatsApi.lockSeat(id, seat._id);
        setSelectedSeats(prev => [...prev, seat]);
        await refreshSeats();
      } catch (err) {
        setError(err.message || 'Failed to lock seat. It may have been taken by another user.');
        await refreshSeats();
      }
    }
  }, [user, id, selectedSeats, navigate]);

  const handleReleaseAllSeats = async () => {
    for (const seat of selectedSeats) {
      try {
        await seatsApi.releaseSeat(id, seat._id);
      } catch (err) {
        console.error('Failed to release seat:', err);
      }
    }
    setSelectedSeats([]);
    await refreshSeats();
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      const idempotencyKey = generateIdempotencyKey();
      const seatIds = selectedSeats.map(s => s._id);

      const { data } = await bookingsApi.createBooking(id, seatIds, idempotencyKey);

      setSuccessMessage(`Booking confirmed! Confirmation: ${data.booking.confirmationNumber}`);
      setSelectedSeats([]);
      
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
      await refreshSeats();
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-800 flex items-center justify-center">
          <span className="text-4xl">😕</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
        <p className="text-dark-400 mb-8">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/')}>Browse Events</Button>
      </div>
    );
  }

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </button>

      {/* Event Header */}
      <div className="card mb-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Event Image */}
          <div className="lg:w-2/5 relative">
            <img
              src={event.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'}
              alt={event.name}
              className="w-full h-64 lg:h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>

          {/* Event Info */}
          <div className="lg:w-3/5 p-6 sm:p-8 relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge-primary">
                <span className="mr-1.5">{getCategoryIcon(event.category)}</span>
                {event.category}
              </span>
              {event.seatStats && (
                <span className={`badge ${event.seatStats.available > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {event.seatStats.available} seats left
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">{event.name}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">{formatDate(event.date)}</p>
                  <p className="text-dark-500 text-sm">Doors: {formatTime(event.doorsOpen || event.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">{event.venue?.name}</p>
                  <p className="text-dark-500 text-sm">{event.venue?.city}</p>
                </div>
              </div>
            </div>

            {event.description && (
              <p className="text-dark-400 leading-relaxed line-clamp-3">{event.description}</p>
            )}

            {event.seatStats && (
              <div className="mt-6 pt-6 border-t border-dark-800 flex flex-wrap gap-6">
                <div>
                  <p className="text-dark-500 text-sm mb-1">Price Range</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(event.seatStats.priceRange?.min)} - {formatCurrency(event.seatStats.priceRange?.max)}
                  </p>
                </div>
                <div>
                  <p className="text-dark-500 text-sm mb-1">Total Capacity</p>
                  <p className="text-xl font-bold text-white">{event.seatStats.total} seats</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-6">
          {successMessage}
        </Alert>
      )}

      {!user && (
        <Alert variant="info" className="mb-6">
          Please{' '}
          <button
            onClick={() => navigate('/login', { state: { from: { pathname: `/events/${id}` } } })}
            className="underline font-semibold hover:text-white"
          >
            sign in
          </button>{' '}
          to select seats and make a booking.
        </Alert>
      )}

      {/* Seat Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Select Your Seats</h2>
            <p className="text-sm text-dark-500">Click on a seat to select</p>
          </div>
          {seatData && (
            <SeatMap
              sections={seatData.sections}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              userId={user?.id}
            />
          )}
        </div>

        {/* Desktop Booking Summary */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Booking Summary</h2>
            <BookingSummary
              selectedSeats={selectedSeats}
              onRemoveSeat={handleSeatSelect}
              onCheckout={handleCheckout}
              loading={bookingLoading}
              lockTimeRemaining={lockTimeRemaining}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Bar */}
      {selectedSeats.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-lg border-t border-dark-800 z-40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-dark-400">
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(totalPrice * 1.1)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowMobileSummary(true)}>
                View Details
              </Button>
              <Button onClick={handleCheckout} loading={bookingLoading}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Summary Modal */}
      {showMobileSummary && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setShowMobileSummary(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-dark-900 rounded-t-3xl border-t border-dark-800 animate-slide-up overflow-hidden">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-dark-800 bg-dark-900">
              <h2 className="text-lg font-bold text-white">Booking Summary</h2>
              <button onClick={() => setShowMobileSummary(false)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(85vh-64px)]">
              <BookingSummary
                selectedSeats={selectedSeats}
                onRemoveSeat={(seat) => {
                  handleSeatSelect(seat);
                  if (selectedSeats.length <= 1) setShowMobileSummary(false);
                }}
                onCheckout={() => {
                  setShowMobileSummary(false);
                  handleCheckout();
                }}
                loading={bookingLoading}
                lockTimeRemaining={lockTimeRemaining}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
