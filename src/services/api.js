import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
 
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})
 
// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
 
// ── Response interceptor: handle 401 token refresh ────────────────────────────
let isRefreshing = false
let failedQueue = []
 
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}
 
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
 
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }
 
      original._retry = true
      isRefreshing = true
 
      const { refreshToken, updateTokens, clearAuth } = useAuthStore.getState()
 
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        updateTokens(data.data)
        processQueue(null, data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
 
    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      const msg = error.response?.data?.message || 'Something went wrong'
      toast.error(msg)
    }
 
    return Promise.reject(error)
  }
)
 
// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}
 
// ── Employees ──────────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:         (params) => api.get('/employees', { params }),
  getOne:         (id)     => api.get(`/employees/${id}`),
  create:         (data)   => api.post('/employees', data),
  update:         (id, data) => api.put(`/employees/${id}`, data),
  delete:         (id)     => api.delete(`/employees/${id}`),
  assignTeam:     (id, data) => api.post(`/employees/${id}/teams`, data),
  removeFromTeam: (id, teamId) => api.delete(`/employees/${id}/teams/${teamId}`),
}
 
// ── Teams ──────────────────────────────────────────────────────────────────────
export const teamAPI = {
  getAll:  (params) => api.get('/teams', { params }),
  getOne:  (id)     => api.get(`/teams/${id}`),
  create:  (data)   => api.post('/teams', data),
  update:  (id, data) => api.put(`/teams/${id}`, data),
  delete:  (id)     => api.delete(`/teams/${id}`),
}
 
// ── Audit Logs ─────────────────────────────────────────────────────────────────
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
}
 
export default api