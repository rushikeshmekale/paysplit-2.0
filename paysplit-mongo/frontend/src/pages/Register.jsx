import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { EnvelopeSimple, Lock, User as UserIcon, ArrowRight } from '@phosphor-icons/react'

const Register = () => {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(email, password, name)
      toast.success('Welcome to PaySplit! 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full pl-11 pr-4 py-4 bg-gray-50/70 border border-gray-100 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]/40 focus:bg-white transition-all outline-none'

  const fields = [
    { label:'Full Name', type:'text',     val:name,     set:setName,     placeholder:'Your name',         Icon:UserIcon },
    { label:'Email',     type:'email',    val:email,    set:setEmail,    placeholder:'you@example.com',   Icon:EnvelopeSimple },
    { label:'Password',  type:'password', val:password, set:setPassword, placeholder:'Min 6 characters',  Icon:Lock },
  ]

  return (
    <div className="min-h-screen max-w-md mx-auto flex items-center justify-center p-5">
      <div className="w-full page-enter">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-purple mb-3">
            <span className="text-3xl font-bold text-white">₹</span>
          </div>
          <h2 className="text-xl font-bold text-[#7c3aed]">PaySplit</h2>
          <p className="text-xs text-gray-400 mt-0.5">Smart bill splitting</p>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-7">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-1">Create Account</h1>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Join PaySplit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, type, val, set, placeholder, Icon }) => (
              <div key={label}>
                <label className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={type} value={val} onChange={(e) => set(e.target.value)}
                    placeholder={placeholder} className={inp} required
                  />
                </div>
              </div>
            ))}

            <div className="pt-1">
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Create Account</span><ArrowRight size={18} weight="bold" /></>}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-3">Already have an account?</p>
            <Link to="/login"
              className="w-full inline-block py-4 bg-purple-50 text-[#7c3aed] rounded-2xl font-bold text-sm hover:bg-purple-100 transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">PaySplit · Powered by Supabase</p>
      </div>
    </div>
  )
}

export default Register
