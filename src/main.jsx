import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify/unstyled'
import AuthcontextProvider from './context/Authcontext.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastContainer />
    <QueryClientProvider client={queryClient}>
      <AuthcontextProvider>
        <App />
      </AuthcontextProvider>
    </QueryClientProvider>
  </StrictMode>,
)
