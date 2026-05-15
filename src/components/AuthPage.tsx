import { FormEvent, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function AuthPage() {
  const {
    authError,
    resetAuthError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetAuthError()
    setIsSubmitting(true)
    try {
      if (isRegisterMode) {
        await signUpWithEmail(email.trim(), password)
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-xl shadow-orange-100/40 backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-peacock-600">Secure access</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Sign in to Thanjavur Marathi</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Use your Google account or email address to sign in and keep your experience synced.
          </p>
        </div>

        {authError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {authError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21.805 10.023h-9.776v3.938h5.598c-.242 1.446-1.66 4.237-5.598 4.237-3.36 0-6.103-2.773-6.103-6.194 0-3.421 2.742-6.194 6.103-6.194 1.915 0 3.187.812 3.92 1.515l2.67-2.575C17.065 2.32 14.841 1 11.996 1 6.66 1 2.31 5.3 2.31 10.86c0 5.56 4.35 9.86 9.686 9.86 5.597 0 9.307-3.905 9.307-9.406 0-.64-.07-1.145-.098-1.291Z" fill="#4285F4"/>
              <path d="M3.904 7.925 7.393 10.4c1.056-3.169 4.268-4.546 7.205-3.29.855.373 1.62.986 2.162 1.622l2.028-1.985C17.658 4.528 14.47 3 11.004 3 7.41 3 4.362 4.79 3.904 7.925Z" fill="#34A853"/>
              <path d="M11.004 22c3.5 0 6.236-1.164 8.348-3.154L16.84 16.9c-1.064.708-2.42 1.316-5.836 1.316-3.493 0-6.477-2.278-7.542-5.4l-3.24 2.5C3.274 19.88 7.689 22 11.004 22Z" fill="#FBBC05"/>
              <path d="M20.887 3.731 18.89 5.7C17.647 4.537 15.5 3.5 11.004 3.5c-3.58 0-6.65 1.708-8.423 4.45l3.072 2.915C6.684 8.796 8.887 7.5 11.004 7.5c2.99 0 4.61 1.987 5.034 3.59h4.849C21.931 6.7 21.627 5.012 20.887 3.731Z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{isRegisterMode ? 'Create account' : 'Email sign in'}</h2>
                <p className="mt-1 text-xs text-slate-600">
                  {isRegisterMode
                    ? 'Create a new account with your email address.'
                    : 'Sign in with the email and password you already use.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterMode((current) => !current)}
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-peacock-700 shadow-sm transition hover:bg-peacock-50"
              >
                {isRegisterMode ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleEmailSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-saffron-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:bg-saffron-300"
              >
                {isSubmitting ? 'Working…' : isRegisterMode ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Once you're signed in, you can build this app as an Android or iOS package using Capacitor or a PWA wrapper.</p>
        </div>
      </div>
    </div>
  )
}
