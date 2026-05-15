import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, googleProvider } from '../firebase'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'

interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  photoURL: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  resetAuthError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function mapFirebaseUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    phoneNumber: firebaseUser.phoneNumber,
    photoURL: firebaseUser.photoURL,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setAuthError('Google sign-in failed. Please try again.')
      console.error(error)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setAuthError('Email sign-in failed. Please check your credentials and try again.')
      console.error(error)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    setAuthError(null)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setAuthError('Unable to create account. Please try again.')
      console.error(error)
    }
  }

  const signOutUser = async () => {
    setAuthError(null)
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      setAuthError('Unable to sign out. Please try again.')
      console.error(error)
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      resetAuthError: () => setAuthError(null),
    }),
    [user, loading, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
