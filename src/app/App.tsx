import { RouterProvider } from '@tanstack/react-router'
import { AppProvider } from '@/providers/AppProvider'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { router } from '@/routes'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  )
}
