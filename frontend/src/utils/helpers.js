export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date, options = {}) {
  const defaultOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function generateIdempotencyKey() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${crypto.randomUUID().substring(0, 8)}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getCategoryIcon(category) {
  const icons = {
    CONCERT: '🎵',
    SPORTS: '🏀',
    THEATER: '🎭',
    COMEDY: '😂',
    FESTIVAL: '🎪',
    OTHER: '🎟️',
  };
  return icons[category] || icons.OTHER;
}
