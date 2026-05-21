'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { auth, googleProvider } from '@/features/auth/client/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function createSession(uid: string, email: string) {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email }),
    })
    if (!res.ok) throw new Error('Session creation failed')
    const data = await res.json()
    return data as { ok: boolean; onboardingCompleted: boolean }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      // 10X FIX: Ensure persistence is set to Local (survives app close)
      await setPersistence(auth, browserLocalPersistence);
      
      const credential = await signInWithPopup(auth, googleProvider)
      const user = credential.user
      const { onboardingCompleted } = await createSession(user.uid, user.email!)
      
      router.push(onboardingCompleted ? '/dashboard' : '/onboarding')
      router.refresh()
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      // Helpful error for the "Missing Initial State" issue
      if (err.code === 'auth/internal-error' || err.message?.includes('initial state')) {
        toast.error("Storage error. Please try logging in with Email/Password or restart the app.")
      } else if (!err.message?.includes('popup-closed')) {
        toast.error("Google sign-in failed. Try again.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const user = credential.user
      const { onboardingCompleted } = await createSession(user.uid, user.email!)
      router.push(onboardingCompleted ? '/dashboard' : '/onboarding')
      router.refresh()
    } catch (err: any) {
      toast.error("Wrong email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🔥</div>
          <h1 className="text-3xl font-bold">Fitterverse</h1>
          <p className="text-muted-foreground">The 10X Accountability Partner</p>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Continue your streak tracking</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border h-11"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading ? <Loader2 className="animate-spin mr-2" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-4 h-4 mr-2" />}
                Continue with Google
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 text-base" disabled={loading || googleLoading}>
                {loading && <Loader2 className="animate-spin mr-2" />}
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                New here? <Link href="/signup" className="text-primary font-bold">Create account</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}