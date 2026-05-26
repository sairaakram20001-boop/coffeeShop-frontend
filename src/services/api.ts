import axios from 'axios'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const isDev = import.meta.env.DEV

const fallbackApiBases = ['http://localhost:53691', 'https://localhost:53690']
const configuredApiBases = envApiBaseUrl && envApiBaseUrl.length > 0 ? [envApiBaseUrl, ...fallbackApiBases] : fallbackApiBases
const uniqueApiBases = Array.from(new Set(configuredApiBases.map((url) => url.replace(/\/$/, ''))))

let activeApiBaseIndex = 0
export const API_BASE_URL = !envApiBaseUrl && isDev ? '' : uniqueApiBases[activeApiBaseIndex]

export const resolveImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl

  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  if (!API_BASE_URL) return normalized
  return `${uniqueApiBases[activeApiBaseIndex]}${normalized}`
}

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (!config.baseURL && API_BASE_URL) {
    config.baseURL = uniqueApiBases[activeApiBaseIndex]
  }
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    if (!API_BASE_URL) return response
    const usedBase = typeof response?.config?.baseURL === 'string' ? response.config.baseURL.replace(/\/$/, '') : ''
    const usedIndex = uniqueApiBases.indexOf(usedBase)
    if (usedIndex >= 0) {
      activeApiBaseIndex = usedIndex
    }
    return response
  },
  async (error) => {
    if (!API_BASE_URL) {
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
    }

    const cfg = error?.config as
      | ({
          _triedApiBaseIndexes?: number[]
        } & Record<string, unknown>)
      | undefined
    const isNetworkFailure = !error?.response
    const isRetriableRequest = Boolean(cfg)

    if (isNetworkFailure && isRetriableRequest) {
      const tried = Array.isArray(cfg?._triedApiBaseIndexes) ? cfg._triedApiBaseIndexes : [activeApiBaseIndex]
      for (let i = 0; i < uniqueApiBases.length; i += 1) {
        if (tried.includes(i)) continue
        try {
          const nextConfig = {
            ...cfg,
            _triedApiBaseIndexes: [...tried, i],
            baseURL: uniqueApiBases[i],
          }
          const retryResponse = await api.request(nextConfig)
          activeApiBaseIndex = i
          return retryResponse
        } catch (retryError) {
          if (i === uniqueApiBases.length - 1) {
            throw retryError
          }
        }
      }
    }

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
