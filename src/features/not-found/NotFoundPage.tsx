import { Link } from '@tanstack/react-router'
import { APP_ROUTES } from '@/constants/routes/app-routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6">
        <p className="text-[120px] font-bold leading-none tracking-tight text-foreground/10 select-none">
          404
        </p>
      </div>

      <div className="mb-8 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => history.back()}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Go back
        </button>
        <Link
          to={APP_ROUTES.DASHBOARD}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
