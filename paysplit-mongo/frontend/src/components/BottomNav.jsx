import { useNavigate, useLocation } from 'react-router-dom'
import { House, Receipt, Users, User } from '@phosphor-icons/react'

const tabs = [
  { path: '/',         icon: House,   label: 'Home'     },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/friends',  icon: Users,   label: 'Friends'  },
  { path: '/profile',  icon: User,    label: 'Profile'  },
]

const BottomNav = () => {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
      <div
        className="bg-white/92 backdrop-blur-2xl border-t border-white/80 flex justify-between items-center px-6 pt-3 pb-7 rounded-t-[32px]"
        style={{ boxShadow: '0 -8px 30px rgba(0,0,0,0.06)' }}
      >
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 w-16 relative transition-all duration-200 ${
                active ? 'text-[#7c3aed]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {active && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full" />
              )}
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${active ? 'bg-purple-50' : ''}`}>
                <Icon size={22} weight={active ? 'fill' : 'regular'} />
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${active ? 'text-[#7c3aed]' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
