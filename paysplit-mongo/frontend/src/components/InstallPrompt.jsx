import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, ArrowDown } from '@phosphor-icons/react'


const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid]       = useState(false)
  const [showIOS, setShowIOS]               = useState(false)
  const [dismissed, setDismissed]           = useState(false)
  const [installing, setInstalling]         = useState(false)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  useEffect(() => {
    if (isInStandalone) return
    if (sessionStorage.getItem('paysplit_install_dismissed')) return

    // Android / Chrome — intercept native prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS — show manual instructions after short delay
    if (isIOS) {
      const t = setTimeout(() => setShowIOS(true), 2500)
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler) }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
    } else {
      setInstalling(false)
    }
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    setDismissed(true)
    sessionStorage.setItem('paysplit_install_dismissed', '1')
  }

  if (dismissed || isInStandalone) return null

  // ── Android / Chrome prompt ──────────────────────────────────
  if (showAndroid) {
    return (
      <>
        {/* Blurred backdrop */}
        <div className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm" onClick={dismiss} />

        {/* Bottom sheet */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[301] rounded-t-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg,#7c3aed 0%,#a855f7 60%,#c084fc 100%)',
            boxShadow: '0 -12px 60px rgba(124,58,237,0.5)',
            animation: 'slideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-4 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

          <div className="relative p-6 pb-10">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mb-5" />

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute top-5 right-5 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Logo + text */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-3xl font-bold text-[#7c3aed]">₹</span>
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Install App</p>
                <h2 className="text-white text-2xl font-bold leading-tight">PaySplit</h2>
                <p className="text-white/60 text-xs mt-0.5">Smart bill splitting · Works offline</p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['⚡ Instant access', '📴 Works offline', '🔔 Reminders', '🏠 Home screen'].map(f => (
                <span key={f} className="px-3 py-1 bg-white/15 rounded-full text-white text-xs font-semibold">
                  {f}
                </span>
              ))}
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full py-4 bg-white text-[#7c3aed] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowDown size={18} weight="bold" />
                  Add to Home Screen
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </>
    )
  }

  // ── iOS Safari instructions ──────────────────────────────────
  if (showIOS) {
    return (
      <>
        <div className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm" onClick={dismiss} />

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[301] rounded-t-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg,#7c3aed 0%,#a855f7 60%,#c084fc 100%)',
            boxShadow: '0 -12px 60px rgba(124,58,237,0.5)',
            animation: 'slideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative p-6 pb-10">
            <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mb-5" />

            <button
              onClick={dismiss}
              className="absolute top-5 right-5 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Logo + text */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-3xl font-bold text-[#7c3aed]">₹</span>
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Install App</p>
                <h2 className="text-white text-2xl font-bold">PaySplit</h2>
                <p className="text-white/60 text-xs mt-0.5">Add to your Home Screen</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6">
              {[
                { icon: <Share size={18} weight="fill" />, text: 'Tap the Share button at the bottom of Safari' },
                { icon: <PlusSquare size={18} weight="fill" />, text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: <span className="text-base">✓</span>, text: 'Tap "Add" — PaySplit appears on your home screen!' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    {step.icon}
                  </div>
                  <p className="text-white text-sm font-semibold leading-snug">{step.text}</p>
                </div>
              ))}
            </div>

            {/* Arrow pointing to Safari share button */}
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs font-bold">
              <span>Look for</span>
              <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                <Share size={14} weight="fill" />
                <span>Share</span>
              </div>
              <span>in your browser toolbar</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100%); }
            to   { transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </>
    )
  }

  return null
}

export default InstallPrompt