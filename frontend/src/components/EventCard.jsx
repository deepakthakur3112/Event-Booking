import { Link } from 'react-router-dom';
import Card from './Card';
import { formatDate, formatTime, formatCurrency, getCategoryIcon } from '../utils/helpers';

export default function EventCard({ event }) {
  const { seatStats } = event;
  const isSoldOut = seatStats?.availableSeats === 0;

  return (
    <Link to={`/events/${event._id}`} className="block group">
      <Card hover className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={event.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
          
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="badge-primary">
              <span className="mr-1.5">{getCategoryIcon(event.category)}</span>
              {event.category}
            </span>
          </div>

          {/* Sold out badge */}
          {isSoldOut && (
            <div className="absolute top-4 right-4">
              <span className="badge-danger">Sold Out</span>
            </div>
          )}

          {/* Price overlay */}
          {seatStats?.priceRange && (
            <div className="absolute bottom-4 left-4">
              <p className="text-xs text-dark-400 mb-1">Starting from</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(seatStats.priceRange.min)}
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {event.name}
          </h3>
          
          <div className="space-y-2.5 text-sm mb-4">
            <div className="flex items-center gap-3 text-dark-400">
              <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">{formatDate(event.date)}</p>
                <p className="text-dark-500 text-xs">{formatTime(event.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-dark-400">
              <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{event.venue?.name}</p>
                <p className="text-dark-500 text-xs truncate">{event.venue?.city}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-dark-800 flex items-center justify-between">
            {seatStats && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  <span className="text-sm text-dark-400">
                    <span className={isSoldOut ? 'text-red-400' : 'text-emerald-400'}>
                      {seatStats.availableSeats}
                    </span>
                    {' '}/ {seatStats.totalSeats} seats
                  </span>
                </div>
                <svg className="w-5 h-5 text-dark-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
