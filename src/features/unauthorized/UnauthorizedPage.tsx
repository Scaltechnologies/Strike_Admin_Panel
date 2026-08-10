import { Link } from '@tanstack/react-router'
import { APP_ROUTES } from '@/constants/routes/app-routes'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <svg
          className="h-10 w-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>

      <div className="mb-8 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Access denied
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          You don't have the necessary permissions to access this page.
          Contact your administrator if you believe this is a mistake.
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
