import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Card, { CardContent } from '../components/Card';
import Button from '../components/Button';
import { PageLoader } from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { formatDate, formatTime, formatCurrency, getCategoryIcon } from '../utils/helpers';

const statusConfig = {
  CONFIRMED: { badge: 'badge-success', label: 'Confirmed' },
  PENDING: { badge: 'badge-warning', label: 'Pending' },
  CANCELLED: { badge: 'badge-danger', label: 'Cancelled' },
  REFUNDED: { badge: 'badge-primary', label: 'Refunded' },
};

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/bookings' } } });
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const { data } = await bookingsApi.getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      await bookingsApi.cancelBooking(bookingId);
      setBookings(prev =>
        prev.map(b =>
          b._id === bookingId ? { ...b, status: 'CANCELLED' } : b
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-dark-400 mt-1">View and manage your event bookings</p>
        </div>
        <Button onClick={() => navigate('/')}>
          Browse Events
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-800 flex items-center justify-center">
              <span className="text-4xl">🎫</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Bookings Yet</h2>
            <p className="text-dark-400 mb-8 max-w-md mx-auto">
              You haven't made any bookings yet. Browse our events and book your first experience!
            </p>
            <Button onClick={() => navigate('/')}>Explore Events</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.PENDING;
            
            return (
              <Card key={booking._id} hover className="animate-fade-in">
                <div className="flex flex-col sm:flex-row">
                  {/* Event Image */}
                  <div className="sm:w-48 lg:w-56 shrink-0">
                    <img
                      src={booking.event?.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400'}
                      alt={booking.event?.name}
                      className="w-full h-40 sm:h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Status & Category */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={status.badge}>{status.label}</span>
                          <span className="text-sm text-dark-500">
                            {getCategoryIcon(booking.event?.category)} {booking.event?.category}
                          </span>
                        </div>

                        {/* Event Name */}
                        <h3 className="text-lg font-semibold text-white mb-3">
                          <Link
                            to={`/events/${booking.event?._id}`}
                            className="hover:text-primary-400 transition-colors"
                          >
                            {booking.event?.name}
                          </Link>
                        </h3>

                        {/* Event Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-dark-400 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(booking.event?.date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(booking.event?.date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {booking.event?.venue?.name}
                          </div>
                        </div>

                        {/* Seats */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {booking.seats?.slice(0, 4).map((seat, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs bg-dark-800 text-dark-300 rounded-lg"
                            >
                              {seat.section} • {seat.row}{seat.seatNumber}
                            </span>
                          ))}
                          {booking.seats?.length > 4 && (
                            <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-lg">
                              +{booking.seats.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Confirmation */}
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 text-sm">Confirmation:</span>
                          <code className="px-2 py-0.5 rounded bg-dark-800 text-primary-400 font-mono text-xs">
                            {booking.confirmationNumber}
                          </code>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-dark-800">
                        <div className="text-right">
                          <p className="text-dark-500 text-sm">Total</p>
                          <p className="text-2xl font-bold gradient-text">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                        </div>

                        {booking.status === 'CONFIRMED' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancel(booking._id)}
                            loading={cancellingId === booking._id}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Booked Date */}
                    <div className="mt-4 pt-4 border-t border-dark-800 text-sm text-dark-500">
                      Booked on {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
