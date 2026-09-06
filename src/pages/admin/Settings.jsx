import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { useSettings } from '../../lib/SettingsProvider.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import BilingualField from '../../components/admin/BilingualField.jsx'
import Icon from '../../components/Icon.jsx'
import Spinner from '../../components/Spinner.jsx'
import { whatsappLink } from '../../lib/whatsapp.js'

const PLACEHOLDERS = ['{{product}}', '{{variant}}', '{{price}}', '{{sku}}', '{{url}}']
const SOIL_PLACEHOLDERS = ['{{name}}', '{{phone}}', '{{location}}', '{{crop}}', '{{area}}']

export default function Settings() {
  const toast = useToast()
  const { reload } = useSettings()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getSettings()
      .then(({ settings }) => setForm(settings))
      .catch((err) => toast.error(err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <Spinner label="Loading settings…" />

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setHero = (key) => (value) => setForm((f) => ({ ...f, hero: { ...f.hero, [key]: value } }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { settings } = await api.saveSettings(form)
      setForm(settings)
      reload()
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const testLink = whatsappLink(form.whatsappNumber, 'Test message from the Rajat Kisan admin panel')

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything here is editable without a redeploy — it lives in
          <code className="mx-1 bg-slate-100 px-1 rounded text-xs">data/settings.json</code>.
        </p>
      </div>

      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-slate-900">WhatsApp</h2>

        <div>
          <label htmlFor="wa" className="label">WhatsApp Business number <span className="text-red-500">*</span></label>
          <input
            id="wa"
            value={form.whatsappNumber}
            onChange={setInput('whatsappNumber')}
            placeholder="919876543210"
            inputMode="numeric"
            className="field font-mono"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Country code first, digits only — no <code className="bg-slate-100 px-1 rounded">+</code>, spaces or dashes.
            For India that is <code className="bg-slate-100 px-1 rounded">91</code> followed by the 10-digit number.
          </p>
          {testLink && (
            <a
              href={testLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#25D366] hover:underline"
            >
              <Icon name="whatsapp" size={17} />
              Send a test message to this number
            </a>
          )}
        </div>

        <BilingualField label="Availability hours" value={form.whatsappHours} onChange={set('whatsappHours')} />
      </section>

      <section className="card p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-bold text-slate-900">Message templates</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            What gets pre-typed into WhatsApp when someone taps a product button.
          </p>
        </div>

        <div>
          <BilingualField
            label="Product enquiry"
            textarea
            rows={8}
            value={form.messageTemplate}
            onChange={set('messageTemplate')}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="text-[11px] bg-agri-50 text-agri-800 border border-agri-200 px-1.5 py-0.5 rounded">
                {p}
              </code>
            ))}
          </div>
        </div>

        <div>
          <BilingualField
            label="Soil test enquiry"
            textarea
            rows={8}
            value={form.soilMessageTemplate}
            onChange={set('soilMessageTemplate')}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SOIL_PLACEHOLDERS.map((p) => (
              <code key={p} className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                {p}
              </code>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Home page hero</h2>
        <BilingualField label="Badge text" value={form.hero?.badge} onChange={setHero('badge')} />
        <BilingualField label="Headline" value={form.hero?.title} onChange={setHero('title')} />
        <BilingualField label="Headline (green part)" value={form.hero?.titleAccent} onChange={setHero('titleAccent')} />
        <BilingualField label="Sub-heading" textarea rows={4} value={form.hero?.subtitle} onChange={setHero('subtitle')} />
      </section>

      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Contact &amp; links</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" value={form.phone} onChange={setInput('phone')} className="field" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" value={form.email} onChange={setInput('email')} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="yt" className="label">YouTube channel URL</label>
            <input id="yt" type="url" value={form.youtubeUrl} onChange={setInput('youtubeUrl')} className="field" />
          </div>
        </div>
        <BilingualField label="Address" textarea rows={2} value={form.address} onChange={set('address')} />
      </section>

      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex justify-end z-30">
        <button type="submit" disabled={saving} className="btn-primary">
          <Icon name={saving ? 'spinner' : 'save'} size={19} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}
