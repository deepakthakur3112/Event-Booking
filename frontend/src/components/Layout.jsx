import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex flex-col items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow text-white shrink-0">
                <span className="text-[10px] font-bold uppercase leading-none mb-0.5">
                  {new Date().toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-black leading-none">
                  {new Date().getDate()}
                </span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Event<span className="gradient-text">-Management</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                Events
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/bookings"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/bookings')
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                    }`}
                  >
                    My Bookings
                  </Link>
                  
                  <div className="ml-4 pl-4 border-l border-dark-700 flex items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                        {user.firstName?.[0]}
                      </div>
                      <span className="text-sm text-dark-300 hidden lg:block">
                        {user.firstName}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn-ghost btn-sm"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="btn-primary btn-sm ml-4">
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-800 animate-slide-down">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-800/50'
                }`}
              >
                Events
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive('/bookings')
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-dark-300 hover:bg-dark-800/50'
                    }`}
                  >
                    My Bookings
                  </Link>
                  
                  <div className="pt-4 mt-4 border-t border-dark-800">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-semibold text-white">
                          {user.firstName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-dark-500">{user.email}</p>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="btn-secondary btn-sm">
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block btn-primary btn-md w-full text-center mt-4"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-dark-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex flex-col items-center justify-center text-white">
                <span className="text-[6px] font-bold uppercase leading-none mb-0.5">
                  {new Date().toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-sm font-black leading-none">
                  {new Date().getDate()}
                </span>
              </div>
              <span className="text-dark-400 text-sm">
                © {new Date().getFullYear()} Event-Management. All rights reserved.
              </span>
            </div>
            <p className="text-xs text-dark-500">
              Real-time seat selection with concurrency control
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
