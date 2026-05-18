import React, { useState, useEffect } from 'react'
import {
  onAuthStateChanged, signOut, signInWithCustomToken,
} from 'firebase/auth'
import {
  collection, query, orderBy, onSnapshot, doc, getDoc,
} from 'firebase/firestore'
import {
  Truck, CheckSquare, Briefcase, LayoutDashboard, Menu, X,
  LogOut, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { auth, db, colPath } from './lib/firebase.js'
import LoginScreen from './components/LoginScreen.jsx'
import NavButton from './components/NavButton.jsx'
import Dashboard from './components/Dashboard.jsx'
import ExpeditionList from './components/ExpeditionList.jsx'
import ExpeditionDetail from './components/ExpeditionDetail.jsx'
import ActionPlanGlobal from './components/ActionPlanGlobal.jsx'
import CompanyList from './components/CompanyList.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [view, setView] = useState('login')
  const [loading, setLoading] = useState(true)
  const [selectedExpeditionId, setSelectedExpeditionId] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notification, setNotification] = useState(null)

  const [expeditions, setExpeditions] = useState([])
  const [companies, setCompanies] = useState([])
  const [actions, setActions] = useState([])
  const [visits, setVisits] = useState([])

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // Auth init
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token)
        }
      } catch { /* login manual */ }
    }
    init()

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await loadProfile(currentUser)
      } else {
        setView('login')
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const loadProfile = async (currentUser) => {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        const d = snap.data()
        setUserProfile({ uid: currentUser.uid, name: d.name || currentUser.email, email: currentUser.email, role: d.role || 'executivo' })
        setView('dashboard')
      } else {
        await signOut(auth)
        showToast('Usuário não cadastrado. Contate o administrador.', 'error')
      }
    } catch {
      await signOut(auth)
      showToast('Erro ao carregar perfil. Verifique a conexão.', 'error')
    }
    setLoading(false)
  }

  // Realtime data
  useEffect(() => {
    if (!user) return

    const unsubExp = onSnapshot(
      query(collection(db, colPath('expeditions')), orderBy('createdAt', 'desc')),
      snap => setExpeditions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.warn('Expeditions index needed:', err.message),
    )
    const unsubComp = onSnapshot(collection(db, colPath('companies')), snap => setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsubAct = onSnapshot(collection(db, colPath('actions')), snap => setActions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsubVis = onSnapshot(collection(db, colPath('visits')), snap => setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    return () => { unsubExp(); unsubComp(); unsubAct(); unsubVis() }
  }, [user])

  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
    setExpeditions([]); setCompanies([]); setActions([]); setVisits([])
  }

  const navigate = (v, expeditionId = null) => {
    setView(v)
    if (expeditionId) setSelectedExpeditionId(expeditionId)
    setMobileMenuOpen(false)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-emerald-50 text-emerald-800 gap-2">
      <Loader2 className="animate-spin" /> Carregando...
    </div>
  )

  if (view === 'login') return <LoginScreen />

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'expeditions', icon: Truck, label: 'Expedições' },
    { id: 'actions', icon: CheckSquare, label: 'Plano de Ação' },
    { id: 'companies', icon: Briefcase, label: 'Empresas' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {notification.message}
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-900 text-white shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Fotus Agro</h1>
          <p className="text-emerald-300 text-xs mt-1">Controlador de Expedições</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <NavButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={view === item.id || (item.id === 'expeditions' && view === 'expedition-detail')}
              onClick={() => { setSelectedExpeditionId(null); navigate(item.id) }}
            />
          ))}
        </nav>
        <div className="p-4 bg-emerald-950/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold border-2 border-emerald-400">
              {userProfile?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{userProfile?.name}</p>
              <p className="text-xs text-emerald-400 capitalize">{userProfile?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-emerald-300 hover:text-white w-full transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-emerald-800 text-white shadow-md z-20">
          <h1 className="font-bold text-lg flex items-center gap-2"><Truck size={20} /> Fotus Agro</h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 active:bg-emerald-700 rounded">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-10 bg-emerald-900/95 text-white pt-20 px-6 flex flex-col gap-4 md:hidden backdrop-blur-sm">
            {navItems.map(item => (
              <NavButton key={item.id} mobile icon={item.icon} label={item.label}
                active={view === item.id} onClick={() => { setSelectedExpeditionId(null); navigate(item.id) }} />
            ))}
            <hr className="border-emerald-700 my-2" />
            <button onClick={logout} className="flex items-center gap-3 text-lg p-3 text-emerald-200"><LogOut /> Sair</button>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 pb-24 md:pb-8">
          {view === 'dashboard' && (
            <Dashboard userProfile={userProfile} expeditions={expeditions} actions={actions} setView={setView} />
          )}
          {view === 'expeditions' && (
            <ExpeditionList
              expeditions={expeditions} userProfile={userProfile} visits={visits}
              onSelect={(id) => navigate('expedition-detail', id)}
              companies={companies} user={user} showToast={showToast}
            />
          )}
          {view === 'expedition-detail' && selectedExpeditionId && (
            <ExpeditionDetail
              expeditionId={selectedExpeditionId} expeditions={expeditions}
              visits={visits.filter(v => v.expeditionId === selectedExpeditionId)}
              actions={actions.filter(a => a.expeditionId === selectedExpeditionId)}
              companies={companies} onBack={() => setView('expeditions')}
              user={user} userProfile={userProfile} showToast={showToast}
            />
          )}
          {view === 'actions' && (
            <ActionPlanGlobal actions={actions} userProfile={userProfile} companies={companies} user={user} showToast={showToast} />
          )}
          {view === 'companies' && (
            <CompanyList companies={companies} showToast={showToast} userProfile={userProfile} />
          )}
        </main>
      </div>
    </div>
  )
}
