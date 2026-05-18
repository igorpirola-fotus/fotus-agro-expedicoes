import React, { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../../lib/firebase.js'
import { Paperclip, X, Loader2, FileText, Image } from 'lucide-react'

export default function FileUpload({ storagePath, attachments = [], onAttachmentsChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFiles = (files) => {
    const file = files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      alert('Formato não suportado. Use JPG, PNG, WEBP ou PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10 MB.')
      return
    }

    setUploading(true)
    const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        onAttachmentsChange([
          ...attachments,
          { name: file.name, url, type: file.type, size: file.size },
        ])
        setUploading(false)
        setProgress(0)
      },
    )
  }

  const remove = (idx) =>
    onAttachmentsChange(attachments.filter((_, i) => i !== idx))

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
            <p className="text-sm text-gray-500">{progress}% enviado...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Paperclip size={18} className="text-gray-400" />
            <p className="text-sm text-gray-500">
              Clique ou arraste arquivos aqui (JPG, PNG, PDF — máx. 10 MB)
            </p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              {att.type?.startsWith('image') ? (
                <Image size={16} className="text-blue-500 shrink-0" />
              ) : (
                <FileText size={16} className="text-red-500 shrink-0" />
              )}
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-emerald-700 hover:underline truncate flex-1"
              >
                {att.name}
              </a>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
