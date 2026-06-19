import { useState, useCallback } from 'react'

const clamp  = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v))
const round2 = (n) => Math.round(n * 100) / 100
const COLORS = ['#7c3aed','#a855f7','#10b981','#f59e0b','#3b82f6','#ef4444','#ec4899']

const equalSplit = (names, total) => {
  if (!names.length) return []
  const pct = round2(100 / names.length)
  return names.map((name, i) => ({
    name,
    percentage: i === names.length - 1 ? round2(100 - pct * (names.length - 1)) : pct,
    amount: round2((pct / 100) * total),
  }))
}

const MODES = [
  { key: 'no_split',   label: 'No Split', emoji: '🎁', tip: 'You paid for someone as a gift or recharge — nobody owes you' },
  { key: 'equal',      label: 'Equal',    emoji: '⚖️', tip: 'Split the total evenly among all participants' },
  { key: 'percentage', label: 'Custom %', emoji: '📊', tip: 'Drag sliders to set each person\'s share (0–100%)' },
  { key: 'custom',     label: 'Amounts',  emoji: '✏️', tip: 'Enter exact ₹ amounts for each person manually' },
]

const SplitSlider = ({ participants = [], totalAmount = 0, onChange, onModeChange }) => {
  const [mode, setMode] = useState('custom')
  const total = Number(totalAmount) || 0
  const names = participants.map((p) => p.name).filter(Boolean)

  const switchMode = useCallback((newMode) => {
    setMode(newMode)
    onModeChange?.(newMode)

    if (newMode === 'no_split') {
      onChange(participants.map((p) => ({ ...p, amount: 0, percentage: 0 })))
      return
    }
    if (newMode === 'equal' || newMode === 'percentage') {
      const splits = equalSplit(names, total)
      onChange(
        participants.map((p) => {
          const s = splits.find((x) => x.name === p.name) ?? { percentage: 0, amount: 0 }
          return { ...p, percentage: s.percentage, amount: s.amount }
        })
      )
      return
    }
    onChange(participants.map((p) => ({ ...p, percentage: 0 })))
  }, [participants, names, total, onChange, onModeChange])

  const handlePct = (idx, val) => {
    const clamped = clamp(val)
    onChange(
      participants.map((p, i) =>
        i === idx
          ? { ...p, percentage: clamped, amount: round2((clamped / 100) * total) }
          : p
      )
    )
  }

  const pctSum = participants.reduce((s, p) => s + (Number(p.percentage) || 0), 0)
  const pctOk  = Math.abs(pctSum - 100) < 1.5

  if (!names.length) return null

  return (
    <div className="space-y-4">

      {/* Mode tabs */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Split Method</p>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-2xl">
          {MODES.map(({ key, label, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                mode === key ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center italic">
          {MODES.find((m) => m.key === mode)?.tip}
        </p>
      </div>

      {/* NO SPLIT */}
      {mode === 'no_split' && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
          <span className="text-2xl flex-shrink-0">🎁</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Gift / Full Payment</p>
            <p className="text-xs text-amber-600 mt-1 leading-relaxed">
              You paid ₹{total.toFixed(2)} and nobody owes you back.
              Perfect for mobile recharges, treats, or surprises.
            </p>
          </div>
        </div>
      )}

      {/* EQUAL */}
        {mode === 'equal' && (
          <div className="space-y-2">
            {participants.filter((p) => p.name).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  >
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#7c3aed]">₹{Number(p.amount || 0).toFixed(2)}</p>
                  {participants.filter(x => x.name).length > 1 && (
                    <p className="text-[10px] text-gray-400">{Number(p.percentage || 0).toFixed(1)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* PERCENTAGE */}
      {mode === 'percentage' && (
        <div className="space-y-5">
          {participants.filter((p) => p.name).map((p, i) => {
            const pct   = Number(p.percentage || 0)
            const color = COLORS[i % COLORS.length]
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ background: color }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0} max={100} step={1} value={pct}
                      onChange={(e) => handlePct(i, Number(e.target.value))}
                      className="w-14 text-right text-sm font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
                    />
                    <span className="text-xs text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Slider track */}
                <div className="relative h-2 bg-gray-200 rounded-full">
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                  <input
                    type="range" min={0} max={100} step={1} value={pct}
                    onChange={(e) => handlePct(i, Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 2 }}
                  />
                </div>
                <p className="text-xs text-right font-semibold" style={{ color }}>
                  ₹{round2((pct / 100) * total).toFixed(2)}
                </p>
              </div>
            )
          })}

          {/* Running total bar */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border ${
            pctOk ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
          }`}>
            <span className={`text-xs font-bold ${pctOk ? 'text-emerald-600' : 'text-red-600'}`}>
              {pctOk ? '✓ Adds up to 100%' : `⚠ ${pctSum.toFixed(0)}% allocated (needs 100%)`}
            </span>
            <div className="flex gap-1 items-center">
              {participants.filter((p) => p.name).map((p, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full transition-all"
                  title={`${p.name}: ${p.percentage}%`}
                  style={{
                    background: COLORS[i % COLORS.length],
                    width: `${Math.max(4, (Number(p.percentage) / Math.max(pctSum, 1)) * 48)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM */}
      {mode === 'custom' && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-xs font-bold text-blue-700">✏️ Manual amounts</p>
          <p className="text-xs text-blue-500 mt-0.5">
            Enter exact ₹ amounts for each participant in the fields above.
          </p>
        </div>
      )}
    </div>
  )
}

export default SplitSlider
