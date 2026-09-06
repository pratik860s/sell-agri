/** A { hi, en } pair edited side by side, so nothing gets translated by accident. */
export default function BilingualField({ label, value, onChange, textarea = false, rows = 3, required, placeholder = {}, hint }) {
  const set = (lang) => (e) => onChange({ ...value, [lang]: e.target.value })
  const Field = textarea ? 'textarea' : 'input'

  return (
    <div>
      <span className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="grid sm:grid-cols-2 gap-3">
        {['hi', 'en'].map((lang) => (
          <div key={lang} className="relative">
            <span className="absolute top-2.5 right-3 text-[10px] font-bold uppercase text-slate-400 pointer-events-none">
              {lang === 'hi' ? 'हिं' : 'EN'}
            </span>
            <Field
              value={value?.[lang] || ''}
              onChange={set(lang)}
              rows={textarea ? rows : undefined}
              placeholder={placeholder[lang] || ''}
              lang={lang}
              className="field pr-12 resize-y"
            />
          </div>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
