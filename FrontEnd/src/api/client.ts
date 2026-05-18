import axios from 'axios'

const client = axios.create({
  baseURL: '/',
  withCredentials: true, // always send HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
})

// Single in-flight refresh promise — prevents race when multiple requests 401 simultaneously
let refreshPromise: Promise<void> | null = null

async function doRefresh(): Promise<void> {
  // Refresh token is in HttpOnly cookie — sent automatically, no body needed
  await axios.post('/auth/refresh', {}, { withCredentials: true })
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = (original?.url as string | undefined)?.startsWith('/auth/')

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => { refreshPromise = null })
        }
        await refreshPromise
        // New access_token cookie is set — retry original request with it automatically
        return client(original)
      } catch {
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default client
