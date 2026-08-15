const BASE = 'https://backend-deployment-dyre.onrender.com'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg || `API error ${res.status}`)
  }
  // DELETE vraća 200 s praznim tijelom
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
}

// ===== PRODUCTS =====
export const productsApi = {
  getAll:   (params = '') => api.get(`/products?${params}`),
  getById:  (id)          => api.get(`/products/${id}`),
  create:   (data)        => api.post('/products', data),
  update:   (id, data)    => api.patch(`/products/${id}`, data),
  delete:   (id)          => api.delete(`/products/${id}`),
}

// ===== USERS =====
export const usersApi = {
  getAll:  (params = '') => api.get(`/users?${params}`),
  getById: (id)          => api.get(`/users/${id}`),
  update:  (id, data)    => api.patch(`/users/${id}`, data),
  delete:  (id)          => api.delete(`/users/${id}`),
}

// ===== FAVORITES =====
export const favoritesApi = {
  getByUser:  (userId)              => api.get(`/favorites?userId=${userId}`),
  add:        (userId, productId)   => api.post('/favorites', { userId, productId, created_at: new Date().toISOString() }),
  remove:     (id)                  => api.delete(`/favorites/${id}`),
  check:      (userId, productId)   => api.get(`/favorites?userId=${userId}&productId=${productId}`),
}

// ===== ORDERS =====
export const ordersApi = {
  getByBuyer:  (userId) => api.get(`/orders?buyerId=${userId}`),
  getBySeller: (userId) => api.get(`/orders?sellerId=${userId}`),
  create:      (data)   => api.post('/orders', data),
  update:      (id, data) => api.patch(`/orders/${id}`, data),
}

// ===== CONVERSATIONS & MESSAGES =====
export const chatApi = {
  getConversations: (userId) =>
    api.get(`/conversations?participant_one=${userId}`)
      .then(async r1 => {
        const r2 = await api.get(`/conversations?participant_two=${userId}`)
        return [...r1, ...r2]
      }),
  getOrCreate: (p1, p2, productId) =>
    api.get(`/conversations?participant_one=${Math.min(p1,p2)}&participant_two=${Math.max(p1,p2)}&productId=${productId}`)
      .then(existing => existing.length
        ? existing[0]
        : api.post('/conversations', {
            participant_one: Math.min(p1, p2),
            participant_two: Math.max(p1, p2),
            productId,
            last_message_at: null,
            created_at: new Date().toISOString(),
          })
      ),
  getMessages: (conversationId) =>
    api.get(`/messages?conversationId=${conversationId}&_sort=created_at&_order=asc`),
  sendMessage: (conversationId, senderId, body) =>
    api.post('/messages', {
      conversationId,
      senderId,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
    }),
  markRead: (messageId) =>
    api.patch(`/messages/${messageId}`, { is_read: true }),
}

// ===== REVIEWS =====
export const reviewsApi = {
  getProductReviews: (productId) => api.get(`/product_reviews?productId=${productId}`),
  getUserReviews:    (userId)    => api.get(`/user_reviews?sellerId=${userId}`),
  addProductReview:  (data)      => api.post('/product_reviews', data),
  addUserReview:     (data)      => api.post('/user_reviews', data),
}

// ===== REPORTS =====
export const reportsApi = {
  getAll:   ()     => api.get('/reports'),
  create:   (data) => api.post('/reports', data),
  update:   (id, data) => api.patch(`/reports/${id}`, data),
}

// ===== CONVERSATIONS =====
export const conversationsApi = {
  getOrCreate: (p1, p2, productId) =>
    api.get(`/conversations?participant_one=${Math.min(p1, p2)}&participant_two=${Math.max(p1, p2)}&productId=${productId}`)
      .then(existing => existing.length
        ? existing[0]
        : api.post('/conversations', {
            participant_one: Math.min(p1, p2),
            participant_two: Math.max(p1, p2),
            productId,
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
      ),
  getMessages: (conversationId) =>
    api.get(`/messages?conversationId=${conversationId}&_sort=created_at&_order=asc`),
  sendMessage: (conversationId, senderId, body) =>
    api.post('/messages', {
      conversationId,
      senderId,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
    }),
  markRead: (messageId) =>
    api.patch(`/messages/${messageId}`, { is_read: true }),
}
