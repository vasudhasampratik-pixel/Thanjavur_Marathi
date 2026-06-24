import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, db, googleProvider } from '../firebase'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  photoURL: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  roles: string[]
  hasRole: (role: string) => boolean
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

export const ADMIN_EMAILS = ['vasudhasamprati.k@gmail.com'] as const;

export function isAdminUser(user: AuthUser | null): boolean {
  return Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase() as typeof ADMIN_EMAILS[number]));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser))
        try {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const data = userSnap.data()
            setRoles(Array.isArray(data.roles) ? data.roles : ['contributor'])
          } else {
            // First time user — create their profile with default role
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              roles: ['contributor'],
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            setRoles(['contributor'])
          }
        } catch (err) {
          console.error('Failed to fetch user roles from Firestore:', err)
          setRoles(['contributor'])
        }
      } else {
        setUser(null)
        setRoles([])
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      const errorCode = (error as { code?: string }).code
      if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          console.error(redirectError)
          setAuthError('Google sign-in failed because the popup was blocked. Redirect fallback also failed.')
          return
        }
      }

      const message = (error as Error)?.message || 'Please try again.'
      setAuthError(`Google sign-in failed. ${message}`)
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
      roles,
      hasRole: (role: string) => roles.includes(role),
      loading,
      authError,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      resetAuthError: () => setAuthError(null),
    }),
    [user, roles, loading, authError]
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
