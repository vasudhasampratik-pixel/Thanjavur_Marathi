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
            <svg width="20" height="20" viewBox="0 0 294 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M150 122.729V180.82H230.727C227.183 199.502 216.545 215.321 200.59 225.957L249.272 263.731C277.636 237.55 294 199.094 294 153.412C294 142.776 293.046 132.548 291.273 122.73L150 122.729Z" fill="#4285F4"/>
              <path d="M65.9342 178.553L54.9546 186.958L16.0898 217.23C40.7719 266.185 91.3596 300.004 149.996 300.004C190.496 300.004 224.45 286.64 249.269 263.731L200.587 225.958C187.223 234.958 170.177 240.413 149.996 240.413C110.996 240.413 77.8602 214.095 65.9955 178.639L65.9342 178.553Z" fill="#34A853"/>
              <path d="M16.0899 82.7734C5.86309 102.955 0 125.728 0 150.001C0 174.273 5.86309 197.047 16.0899 217.228C16.0899 217.363 66.0004 178.5 66.0004 178.5C63.0004 169.5 61.2272 159.955 61.2272 149.999C61.2272 140.043 63.0004 130.498 66.0004 121.498L16.0899 82.7734Z" fill="#FBBC05"/>
              <path d="M149.999 59.7279C172.091 59.7279 191.727 67.3642 207.409 82.0918L250.364 39.1373C224.318 14.8647 190.5 0 149.999 0C91.3627 0 40.7719 33.6821 16.0898 82.7738L65.9988 121.502C77.8619 86.0462 110.999 59.7279 149.999 59.7279Z" fill="#EA4335"/>
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

      </div>
    </div>
  )
}
