import { useState, useEffect } from 'react';
import { eventsApi } from '../api/client';
import EventCard from '../components/EventCard';
import { PageLoader } from '../components/LoadingSpinner';
import Alert from '../components/Alert';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await eventsApi.getCategories();
        setCategories(Array.isArray(data) ? data : (data?.categories || []));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        const response = await eventsApi.getEvents(params);
        console.log('API Response received:', response);
        
        // Handle both direct array and wrapped response formats
        const eventData = response?.data || response;
        const eventsArray = Array.isArray(eventData) ? eventData : (eventData?.events || []);
        
        console.log('Processed events array:', eventsArray);
        setEvents(eventsArray);
      } catch (err) {
        console.error('Fetch events error:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedCategory]);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
          Live Ticket Booking
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Discover{' '}
          <span className="gradient-text">Amazing Events</span>
        </h1>
        <p className="text-lg sm:text-xl text-dark-400 max-w-2xl mx-auto leading-relaxed">
          Book tickets to the hottest concerts, sports events, theater shows, and more.
          Real-time seat selection with guaranteed availability.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-10 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max pb-2 sm:justify-center">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-dark-800/50 text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            All Events
          </button>
          {categories.map(({ category, count }) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800/50 text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {category}
              <span className="ml-2 text-xs opacity-60">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-8">
          {error}
        </Alert>
      )}

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-800 flex items-center justify-center">
            <span className="text-4xl">🎭</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No events found</h2>
          <p className="text-dark-400 mb-8">
            {selectedCategory
              ? `No ${selectedCategory.toLowerCase()} events available at the moment.`
              : 'Check back soon for upcoming events!'}
          </p>
          
          <div className="p-6 rounded-2xl bg-dark-900/50 border border-dark-800 max-w-lg mx-auto text-left">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Diagnostic Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-dark-500">API URL:</span>
                <code className="text-primary-400">{import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}</code>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-500">Events Count:</span>
                <span className="text-white">{events.length}</span>
              </div>
              <div className="mt-4 p-3 bg-primary-500/5 rounded-xl border border-primary-500/10">
                <p className="text-xs text-primary-400 mb-2 font-medium">
                  To fix this, please run the seed command in your terminal:
                </p>
                <code className="block p-2 bg-dark-950 rounded text-[10px] text-dark-300 font-mono break-all">
                  docker compose exec backend npm run seed
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div
              key={event._id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}

      {/* Stats Section */}
      <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Active Events', value: events.length, icon: (
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-[10px] font-bold uppercase mb-0.5">{new Date().toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-lg font-black">{new Date().getDate()}</span>
            </div>
          ), color: 'from-primary-500 to-purple-500' },
          { label: 'Venues', value: new Set(events.map(e => e.venue?.name)).size, icon: '🏟️', color: 'from-emerald-500 to-teal-500' },
          { label: 'Categories', value: categories.length, icon: '🎯', color: 'from-amber-500 to-orange-500' },
          { label: 'Cities', value: new Set(events.map(e => e.venue?.city)).size, icon: '🌆', color: 'from-pink-500 to-rose-500' },
        ].map((stat, i) => (
          <div
            key={i}
            className="card p-6 text-center group hover:border-dark-700 transition-all"
          >
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-dark-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
