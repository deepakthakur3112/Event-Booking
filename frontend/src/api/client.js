const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'Request failed');
        error.status = response.status;
        error.code = data.error?.code;
        error.details = data.error?.details;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
};

// Events API
export const eventsApi = {
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/events${query ? `?${query}` : ''}`);
  },
  getEventById: (eventId) => apiClient.get(`/events/${eventId}`),
  getEventSeats: (eventId) => apiClient.get(`/events/${eventId}/seats`),
  getUpcoming: (limit = 5) => apiClient.get(`/events/upcoming?limit=${limit}`),
  getCategories: () => apiClient.get('/events/categories'),
};

// Seats API
export const seatsApi = {
  lockSeat: (eventId, seatId) => apiClient.post(`/seats/events/${eventId}/seats/${seatId}/lock`),
  lockMultipleSeats: (eventId, seatIds) => apiClient.post(`/seats/events/${eventId}/lock`, { seatIds }),
  releaseSeat: (eventId, seatId) => apiClient.delete(`/seats/events/${eventId}/seats/${seatId}/lock`),
  getMyLockedSeats: () => apiClient.get('/seats/my-locked'),
};

// Bookings API
export const bookingsApi = {
  createBooking: (eventId, seatIds, idempotencyKey) => 
    apiClient.post('/bookings', { eventId, seatIds }, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }),
  getMyBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/bookings${query ? `?${query}` : ''}`);
  },
  getBookingById: (bookingId) => apiClient.get(`/bookings/${bookingId}`),
  cancelBooking: (bookingId) => apiClient.post(`/bookings/${bookingId}/cancel`),
};

export default apiClient;

