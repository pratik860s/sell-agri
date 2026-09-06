import Icon from './Icon.jsx'

/**
 * The site's only call to action. `href` null means the admin has not configured
 * a WhatsApp number yet — the button is then disabled rather than silently broken.
 */
export default function WhatsAppButton({ href, label, size = 'md', className = '', onClick }) {
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2.5',
    lg: 'px-7 py-4 text-lg gap-3'
  }
  const base = `inline-flex items-center justify-center rounded-xl font-bold transition active:scale-[.98] ${sizes[size]} ${className}`

  if (!href) {
    return (
      <span className={`${base} bg-slate-200 text-slate-400 cursor-not-allowed`} aria-disabled="true">
        <Icon name="whatsapp" size={size === 'lg' ? 24 : 20} />
        {label}
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`${base} bg-[#25D366] hover:bg-[#1eb356] text-white shadow-lg shadow-[#25D366]/25`}
    >
      <Icon name="whatsapp" size={size === 'lg' ? 24 : 20} />
      {label}
    </a>
  )
}
