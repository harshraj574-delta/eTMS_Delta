import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { QueryClient, QueryCache, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { toastService } from './services/toastService'

const queryClient = new QueryClient({
  // Global error surface: one toast per failed query, decided in one place.
  queryCache: new QueryCache({
    onError: (error, query) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return // axios interceptor handles logout
      if (query?.meta?.silent) return // imperative call sites toast in their own catch
      if (query?.state?.data !== undefined) return // background refresh failed; stale data still shown
      toastService.error(query?.meta?.errorMessage || 'Failed to load data. Please try again.')
    },
  }),
  defaultOptions: {
    queries: {
      // Retry network/server errors; fail fast on 4xx (a client error will
      // not succeed on retry, and 401 already triggered the logout interceptor)
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 60000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
