import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card, { CardContent } from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const DEMO_ACCOUNTS = [
  { email: 'john.doe@example.com', password: 'password123', name: 'John Doe' },
  { email: 'jane.smith@example.com', password: 'password123', name: 'Jane Smith' },
  { email: 'bob.wilson@example.com', password: 'password123', name: 'Bob Wilson' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl shadow-primary-500/30 text-white">
              <span className="text-xs font-bold uppercase tracking-wider leading-none mb-1">
                {new Date().toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-2xl font-black leading-none">
                {new Date().getDate()}
              </span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-dark-400">
            Sign in to continue to Event-Management
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-dark-500 bg-dark-900">Demo Accounts</span>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickLogin(account)}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-dark-800/50 to-dark-800/30 border border-dark-700 hover:border-primary-500/50 hover:bg-dark-800/70 transition-all group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{account.name}</p>
                        <p className="text-dark-500 text-sm">{account.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-dark-500 text-xs mb-1">Password</p>
                      <code className="px-2 py-0.5 rounded bg-dark-900 text-primary-400 font-mono text-xs">
                        {account.password}
                      </code>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-dark-500 group-hover:text-primary-400 transition-colors">
                    Click to auto-fill credentials →
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-sm text-dark-500">
          Don't have an account?{' '}
          <span className="text-primary-400 hover:text-primary-300 cursor-pointer">
            Contact us for access
          </span>
        </p>
      </div>
    </div>
  );
}
