import { useRef, useState } from 'react'
import { api } from '../../lib/api.js'
import { useToast } from './Toast.jsx'
import Icon from '../Icon.jsx'

const MAX_EDGE = 1200
const QUALITY = 0.82

/**
 * Resizes to WebP in the browser before uploading. Keeps the payload that travels
 * to the serverless function (and then into a git commit) small.
 */
function compress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a readable image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ImageUploader({ images, onChange }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const handleFiles = async (files) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }
        const dataUrl = await compress(file)
        const { url } = await api.uploadImage(file.name, dataUrl)
        uploaded.push(url)
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded])
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const addUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      toast.error('Enter a full https:// URL')
      return
    }
    onChange([...images, url])
    setUrlDraft('')
  }

  const move = (from, to) => {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <span className="label">Images</span>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-agri-600 text-white px-1.5 py-0.5 rounded">
                  MAIN
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1 text-white disabled:opacity-30" aria-label="Move left">
                  <Icon name="arrowLeft" size={15} />
                </button>
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="p-1 text-red-300 hover:text-red-100" aria-label="Remove">
                  <Icon name="trash" size={15} />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} className="p-1 text-white disabled:opacity-30" aria-label="Move right">
                  <Icon name="arrowRight" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-ghost">
          <Icon name={busy ? 'spinner' : 'image'} size={18} />
          {busy ? 'Uploading…' : 'Upload images'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addUrl()
            }
          }}
          placeholder="…or paste an image URL"
          className="field flex-1"
        />
        <button type="button" onClick={addUrl} className="btn-ghost shrink-0">
          <Icon name="plus" size={18} />
          Add
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Images are resized to WebP in your browser, committed to <code className="bg-slate-100 px-1 rounded">public/products/</code>,
        and served over the jsDelivr CDN. The first image is the one shown on cards.
      </p>
    </div>
  )
}
