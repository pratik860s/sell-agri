import Icon from './Icon.jsx'

export default function Spinner({ label, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-400 ${className}`}>
      <Icon name="spinner" size={32} strokeWidth={2.2} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
