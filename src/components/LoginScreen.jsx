import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import { Truck, Loader2, AlertTriangle } from 'lucide-react'
import Input from './ui/Input.jsx'
import Button from './ui/Button.jsx'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email || !password) { setErrorMsg('Preencha o e-mail e a senha.'); return }
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado. Contate o administrador.',
        'auth/wrong-password': 'Senha incorreta. Tente novamente.',
        'auth/invalid-email': 'Formato de e-mail inválido.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
      }
      setErrorMsg(msgs[error.code] || 'Erro no login: ' + error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Truck className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Fotus Agro</h1>
          <p className="text-gray-500 mt-1">Plataforma de Expedições</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <Input label="E-mail Corporativo" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@fotusagro.com.br" />
          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" /> {errorMsg}
            </div>
          )}
          <Button type="submit" className="w-full py-3 text-lg" disabled={isLoading}>
            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Acessar Sistema'}
          </Button>
        </form>
      </div>
    </div>
  )
}
