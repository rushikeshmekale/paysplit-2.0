import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { EnvelopeSimple, Lock, ArrowRight } from '@phosphor-icons/react'

const Login = () => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 👋')
      navigate('/')
    } catch (err) {
      toast.error(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full pl-11 pr-4 py-4 bg-gray-50/70 border border-gray-100 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]/40 focus:bg-white transition-all outline-none'

  return (
    <div className="min-h-screen max-w-md mx-auto flex items-center justify-center p-5">
      <div className="w-full page-enter">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-purple mb-3">
            <span className="text-3xl font-bold text-white">₹</span>
          </div>
          <h2 className="text-xl font-bold text-[#7c3aed]">PaySplit</h2>
          <p className="text-xs text-gray-400 mt-0.5">Smart bill splitting</p>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-7">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">Email</label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className={inp} required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold tracking-widest uppercase text-gray-400">Password</label>
                <button type="button" className="text-xs font-semibold text-[#7c3aed]">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className={inp} required
                />
              </div>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight size={18} weight="bold" /></>}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-3">Don't have an account?</p>
            <Link to="/register"
              className="w-full inline-block py-4 bg-purple-50 text-[#7c3aed] rounded-2xl font-bold text-sm hover:bg-purple-100 transition-colors">
              Create Account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">PaySplit</p>
      </div>
    </div>
  )
}

export default Login
