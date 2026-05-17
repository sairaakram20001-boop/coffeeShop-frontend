import axios from 'axios'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

// Use env override when provided; otherwise use local backend HTTP endpoint.
export const API_BASE_URL = (envApiBaseUrl && envApiBaseUrl.length > 0
  ? envApiBaseUrl
  : 'http://localhost:53691'
).replace(/\/$/, '')

export const resolveImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl

  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${API_BASE_URL}${normalized}`
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Unexpected server error'

    window.dispatchEvent(
      new CustomEvent('api:error', {
        detail: { status, message },
      }),
    )

    return Promise.reject(error)
  },
)

export default api
