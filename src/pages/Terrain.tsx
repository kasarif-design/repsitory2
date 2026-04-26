import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui'
import { supabase } from '../lib/supabase'
import {
  Clock, Camera, TrendingUp, CheckCircle2, AlertCircle,
  Loader2, Plus, Minus, User, HardHat, MapPin, Calendar,
  Upload, Image, AlertTriangle, ChevronUp, ChevronDown,
} from 'lucide-react'

type TabId = 'pointage' | 'photos' | 'avancement'

interface Employe {
  id: string
  nom: string
  prenom: string
  corps_metier: string
  statut: string
  taux_horaire: number
}

interface Chantier {
  id: string
  nom: string
  ville: string
  statut: string
  avancement: number
  date_fin_prevue: string | null
  chef_chantier_nom: string | null
}

interface PointageRow {
  id: string
  employe_id: string
  chantier_id: string
  date: string
  heures_travaillees: number
  type_travail: string
  notes: string | null
  created_at: string
}

interface Photo {
  id: string
  chantier_id: string
  url: string
  nom_fichier: string
  description: string | null
  categorie: string
  prise_par: string | null
  created_at: string
}

type Categorie = 'avancement' | 'avant' | 'apres' | 'probleme' | 'reception' | 'autre'

const CAT_CONFIG: Record<Categorie, { label: string; color: string; bg: string; border: string }> = {
  avancement: { label: 'Avancement',  color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300' },
  avant:      { label: 'Avant',       color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-300' },
  apres:      { label: 'Apres',       color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300' },
  probleme:   { label: 'Probleme',    color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300' },
  reception:  { label: 'Reception',  color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
  autre:      { label: 'Autre',       color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-300' },
}

const TYPE_TRAVAIL: { value: string; label: string; color: string; active: string }[] = [
  { value: 'normal',     label: 'Normal',      color: 'border-slate-300 text-slate-700',    active: 'bg-slate-800 border-slate-800 text-white' },
  { value: 'heures_sup', label: 'Heures sup',  color: 'border-amber-300 text-amber-700',    active: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'nuit',       label: 'Nuit',         color: 'border-indigo-300 text-indigo-700',  active: 'bg-indigo-600 border-indigo-600 text-white' },
  { value: 'weekend',    label: 'Week-end',     color: 'border-purple-300 text-purple-700',  active: 'bg-purple-600 border-purple-600 text-white' },
  { value: 'ferie',      label: 'Ferie',        color: 'border-red-300 text-red-700',        active: 'bg-red-600 border-red-600 text-white' },
]

const isoToday = () => new Date().toISOString().slice(0, 10)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const formatEuro = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const daysRemaining = (date_fin: string | null): number | null => {
  if (!date_fin) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fin = new Date(date_fin)
  fin.setHours(0, 0, 0, 0)
  return Math.round((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export default function Terrain() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('pointage')

  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loadingInit, setLoadingInit] = useState(true)

  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const [ptChantier, setPtChantier] = useState('')
  const [ptEmploye, setPtEmploye] = useState('')
  const [ptDate, setPtDate] = useState(isoToday())
  const [ptHeures, setPtHeures] = useState(8)
  const [ptType, setPtType] = useState('normal')
  const [ptNotes, setPtNotes] = useState('')
  const [ptSaving, setPtSaving] = useState(false)
  const [ptSuccess, setPtSuccess] = useState(false)
  const [recentPointages, setRecentPointages] = useState<PointageRow[]>([])
  const [loadingPointages, setLoadingPointages] = useState(false)

  const [phChantier, setPhChantier] = useState('')
  const [phPending, setPhPending] = useState<{ file: File; preview: string } | null>(null)
  const [phCategorie, setPhCategorie] = useState<Categorie>('avancement')
  const [phDescription, setPhDescription] = useState('')
  const [phPrisePar, setPhPrisePar] = useState('')
  const [phUploading, setPhUploading] = useState(false)
  const [phProgress, setPhProgress] = useState(0)
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [avChantiers, setAvChantiers] = useState<{ chantier: Chantier; value: number; saving: boolean }[]>([])

  const loadAll = async () => {
    if (!user) return
    setLoadingInit(true)
    const [{ data: cData }, { data: eData }] = await Promise.all([
      supabase
        .from('chantiers')
        .select('id, nom, ville, statut, avancement, date_fin_prevue, chef_chantier_nom')
        .eq('user_id', user.id)
        .order('nom'),
      supabase
        .from('employes')
        .select('id, nom, prenom, corps_metier, statut, taux_horaire')
        .eq('user_id', user.id)
        .eq('statut', 'actif'),
    ])
    const allChantiers: Chantier[] = cData || []
    setChantiers(allChantiers)
    setEmployes(eData || [])

    const actifs = allChantiers.filter(c => c.statut === 'en_cours')
    setAvChantiers(actifs.map(c => ({ chantier: c, value: c.avancement ?? 0, saving: false })))

    if (allChantiers.length > 0) {
      const premier = allChantiers.find(c => c.statut === 'en_cours' || c.statut === 'planifie')?.id ?? allChantiers[0].id
      if (!ptChantier) setPtChantier(premier)
      if (!phChantier) setPhChantier(premier)
    }
    setLoadingInit(false)
  }

  const loadRecentPointages = async () => {
    if (!user || !ptChantier) return
    setLoadingPointages(true)
    const { data } = await supabase
      .from('pointages')
      .select('*')
      .eq('user_id', user.id)
      .eq('chantier_id', ptChantier)
      .eq('date', ptDate)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentPointages(data || [])
    setLoadingPointages(false)
  }

  const loadRecentPhotos = async () => {
    if (!user || !phChantier) { setRecentPhotos([]); return }
    setLoadingPhotos(true)
    const { data } = await supabase
      .from('photos_chantier')
      .select('*')
      .eq('user_id', user.id)
      .eq('chantier_id', phChantier)
      .order('created_at', { ascending: false })
      .limit(6)
    setRecentPhotos(data || [])
    setLoadingPhotos(false)
  }

  useEffect(() => { loadAll() }, [user])
  useEffect(() => { if (ptChantier) loadRecentPointages() }, [ptChantier, ptDate, user])
  useEffect(() => { if (phChantier) loadRecentPhotos() }, [phChantier, user])

  const chantiersActifs = chantiers.filter(c => c.statut === 'en_cours' || c.statut === 'planifie')

  const ptEmployeObj = employes.find(e => e.id === ptEmploye)
  const ptCout = ptEmployeObj ? ptHeures * Number(ptEmployeObj.taux_horaire ?? 0) : null

  const handleSavePointage = async () => {
    if (!ptChantier) { showToast('Selectionnez un chantier', 'error'); return }
    if (!ptEmploye) { showToast('Selectionnez un employe', 'error'); return }
    if (ptHeures < 0.5 || ptHeures > 24) { showToast('Heures entre 0.5 et 24', 'error'); return }
    setPtSaving(true)
    const { error } = await supabase.from('pointages').insert({
      user_id: user!.id,
      employe_id: ptEmploye,
      chantier_id: ptChantier,
      date: ptDate,
      heures_travaillees: ptHeures,
      type_travail: ptType,
      notes: ptNotes.trim() || null,
    })
    if (error) {
      showToast('Erreur : ' + error.message, 'error')
    } else {
      setPtSuccess(true)
      setPtNotes('')
      setPtType('normal')
      setPtHeures(8)
      showToast('Pointage enregistre !', 'success')
      await loadRecentPointages()
      setTimeout(() => setPtSuccess(false), 2000)
    }
    setPtSaving(false)
  }

  const adjustHeures = (delta: number) => {
    setPtHeures(prev => {
      const next = Math.round((prev + delta) * 2) / 2
      return Math.min(24, Math.max(0.5, next))
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (phPending) URL.revokeObjectURL(phPending.preview)
    setPhPending({ file, preview })
    setPhCategorie('avancement')
    setPhDescription('')
    if (e.target) e.target.value = ''
  }

  const handlePublish = async () => {
    if (!phPending || !phChantier || !user) return
    setPhUploading(true)
    setPhProgress(10)
    const path = `${user.id}/${phChantier}/${Date.now()}_${phPending.file.name}`
    const { error: upErr } = await supabase.storage
      .from('photos-chantier')
      .upload(path, phPending.file, { upsert: false })
    if (upErr) {
      showToast('Erreur upload : ' + upErr.message, 'error')
      setPhUploading(false)
      setPhProgress(0)
      return
    }
    setPhProgress(70)
    const { data: publicData } = supabase.storage.from('photos-chantier').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('photos_chantier').insert({
      user_id: user.id,
      chantier_id: phChantier,
      url: publicData.publicUrl,
      nom_fichier: phPending.file.name,
      description: phDescription.trim() || null,
      categorie: phCategorie,
      prise_par: phPrisePar.trim() || null,
    })
    if (dbErr) {
      showToast('Erreur BDD : ' + dbErr.message, 'error')
    } else {
      setPhProgress(100)
      showToast('Photo publiee !', 'success')
      URL.revokeObjectURL(phPending.preview)
      setPhPending(null)
      setPhDescription('')
      setPhPrisePar('')
      setPhCategorie('avancement')
      await loadRecentPhotos()
    }
    setPhUploading(false)
    setTimeout(() => setPhProgress(0), 800)
  }

  const handleAdjustAvancement = (idx: number, delta: number) => {
    setAvChantiers(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const next = Math.min(100, Math.max(0, item.value + delta))
      return { ...item, value: next }
    }))
  }

  const handleAvancementChange = (idx: number, val: number) => {
    setAvChantiers(prev => prev.map((item, i) =>
      i === idx ? { ...item, value: Math.min(100, Math.max(0, val)) } : item
    ))
  }

  const handleSaveAvancement = async (idx: number) => {
    const item = avChantiers[idx]
    if (!user) return
    setAvChantiers(prev => prev.map((it, i) => i === idx ? { ...it, saving: true } : it))
    const { error } = await supabase
      .from('chantiers')
      .update({ avancement: item.value })
      .eq('id', item.chantier.id)
    if (error) {
      showToast('Erreur : ' + error.message, 'error')
    } else {
      showToast(`Avancement mis a jour : ${item.value}%`, 'success')
      setAvChantiers(prev => prev.map((it, i) =>
        i === idx ? { ...it, chantier: { ...it.chantier, avancement: it.value }, saving: false } : it
      ))
    }
    setAvChantiers(prev => prev.map((it, i) => i === idx ? { ...it, saving: false } : it))
  }

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'pointage',   label: 'Pointage',   icon: Clock },
    { id: 'photos',     label: 'Photos',     icon: Camera },
    { id: 'avancement', label: 'Avancement', icon: TrendingUp },
  ]

  if (loadingInit) {
    return (
      <AppLayout title="Terrain" description="Vue mobile chantier">
        <div className="space-y-4 pb-24">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Terrain" description="Vue mobile chantier">
      <div className="pb-28 max-w-lg mx-auto">

        {activeTab === 'pointage' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Chantier</label>
                <select
                  value={ptChantier}
                  onChange={e => setPtChantier(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base font-medium text-slate-900 bg-white focus:outline-none focus:border-slate-900 appearance-none"
                  style={{ minHeight: 56 }}
                >
                  <option value="">-- Choisir un chantier --</option>
                  {chantiersActifs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom}{c.ville ? ` — ${c.ville}` : ''}
                    </option>
                  ))}
                </select>
                {chantiersActifs.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Aucun chantier actif ou planifie
                  </p>
                )}
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Employe</label>
                <select
                  value={ptEmploye}
                  onChange={e => setPtEmploye(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base font-medium text-slate-900 bg-white focus:outline-none focus:border-slate-900 appearance-none"
                  style={{ minHeight: 56 }}
                >
                  <option value="">-- Choisir un employe --</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom}{e.corps_metier ? ` — ${e.corps_metier}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Date</label>
                <input
                  type="date"
                  value={ptDate}
                  onChange={e => setPtDate(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  style={{ minHeight: 56 }}
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Heures travaillees</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustHeures(-0.5)}
                    className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center touch-manipulation"
                  >
                    <Minus className="w-6 h-6 text-slate-700" />
                  </button>
                  <input
                    type="number"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={ptHeures}
                    onChange={e => setPtHeures(parseFloat(e.target.value) || 0.5)}
                    className="flex-1 text-center px-4 py-4 rounded-xl border-2 border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    style={{ minHeight: 56 }}
                  />
                  <button
                    onClick={() => adjustHeures(0.5)}
                    className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center touch-manipulation"
                  >
                    <Plus className="w-6 h-6 text-slate-700" />
                  </button>
                </div>
                <p className="text-center text-sm text-slate-500 mt-1">{ptHeures} heure{ptHeures !== 1 ? 's' : ''}</p>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Type de travail</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TYPE_TRAVAIL.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setPtType(t.value)}
                      className={`px-3 py-3.5 rounded-xl border-2 text-base font-semibold transition-all touch-manipulation ${
                        ptType === t.value ? t.active : `bg-white ${t.color}`
                      }`}
                      style={{ minHeight: 56 }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-800 mb-2">Notes <span className="text-slate-400 font-normal text-sm">(optionnel)</span></label>
                <textarea
                  value={ptNotes}
                  onChange={e => setPtNotes(e.target.value)}
                  rows={3}
                  placeholder="Observations, remarques..."
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base text-slate-900 focus:outline-none focus:border-slate-900 resize-none placeholder:text-slate-400"
                />
              </div>

              {ptCout !== null && (
                <div className="flex items-center justify-between px-4 py-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-base font-semibold text-emerald-800">Cout estime</span>
                  <span className="text-xl font-bold text-emerald-700">{formatEuro(ptCout)}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSavePointage}
              disabled={ptSaving || ptSuccess}
              className={`w-full flex items-center justify-center gap-3 rounded-2xl font-bold text-lg transition-all touch-manipulation ${
                ptSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
              } disabled:opacity-70`}
              style={{ minHeight: 64 }}
            >
              {ptSaving
                ? <><Loader2 className="w-6 h-6 animate-spin" /> Enregistrement...</>
                : ptSuccess
                ? <><CheckCircle2 className="w-6 h-6" /> Pointe !</>
                : <><CheckCircle2 className="w-6 h-6" /> Enregistrer le pointage</>
              }
            </button>

            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pointages du jour sur ce chantier
              </p>
              {loadingPointages ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : recentPointages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
                  Aucun pointage aujourd'hui sur ce chantier
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPointages.map(p => {
                    const emp = employes.find(e => e.id === p.employe_id)
                    const typeDef = TYPE_TRAVAIL.find(t => t.value === p.type_travail)
                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu'}
                            </p>
                            <p className="text-xs text-slate-500">{typeDef?.label ?? p.type_travail}</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-slate-900 flex-shrink-0 ml-3">
                          {Number(p.heures_travaillees).toFixed(1)}h
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <label className="block text-base font-semibold text-slate-800 mb-2">Chantier</label>
              <select
                value={phChantier}
                onChange={e => setPhChantier(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base font-medium text-slate-900 bg-white focus:outline-none focus:border-slate-900 appearance-none"
                style={{ minHeight: 56 }}
              >
                <option value="">-- Choisir un chantier --</option>
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom}{c.ville ? ` — ${c.ville}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                disabled={!phChantier}
                className="flex flex-col items-center justify-center gap-2 bg-slate-900 active:bg-slate-700 text-white rounded-2xl font-semibold text-base disabled:opacity-50 touch-manipulation"
                style={{ minHeight: 80 }}
              >
                <Camera className="w-7 h-7" />
                Prendre une photo
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                disabled={!phChantier}
                className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-200 active:bg-slate-50 text-slate-800 rounded-2xl font-semibold text-base disabled:opacity-50 touch-manipulation"
                style={{ minHeight: 80 }}
              >
                <Image className="w-7 h-7" />
                Galerie
              </button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {phPending && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={phPending.preview}
                    alt="apercu"
                    className="w-full object-cover"
                    style={{ maxHeight: 240 }}
                  />
                  <button
                    onClick={() => { URL.revokeObjectURL(phPending.preview); setPhPending(null) }}
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2">Categorie</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(CAT_CONFIG) as Categorie[]).map(cat => {
                        const cfg = CAT_CONFIG[cat]
                        const active = phCategorie === cat
                        return (
                          <button
                            key={cat}
                            onClick={() => setPhCategorie(cat)}
                            className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                              active
                                ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2">Prise par</label>
                    <input
                      type="text"
                      value={phPrisePar}
                      onChange={e => setPhPrisePar(e.target.value)}
                      placeholder="Votre nom..."
                      className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base text-slate-900 focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
                      style={{ minHeight: 56 }}
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2">Description <span className="text-slate-400 font-normal text-sm">(optionnel)</span></label>
                    <textarea
                      value={phDescription}
                      onChange={e => setPhDescription(e.target.value)}
                      rows={2}
                      placeholder="Contexte, remarques..."
                      className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-base text-slate-900 focus:outline-none focus:border-slate-900 resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {phUploading && (
                    <div>
                      <div className="flex justify-between text-sm font-medium text-slate-600 mb-1.5">
                        <span>Upload en cours...</span>
                        <span>{phProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                          className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${phProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={phUploading}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-lg disabled:opacity-60 touch-manipulation"
                    style={{ minHeight: 64 }}
                  >
                    {phUploading
                      ? <><Loader2 className="w-6 h-6 animate-spin" /> Publication...</>
                      : <><Upload className="w-6 h-6" /> Publier la photo</>
                    }
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                6 dernieres photos du chantier
              </p>
              {loadingPhotos ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : recentPhotos.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
                  Aucune photo pour ce chantier
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {recentPhotos.map(ph => {
                    const cfg = CAT_CONFIG[ph.categorie as Categorie]
                    return (
                      <div key={ph.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={ph.url}
                          alt={ph.nom_fichier}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {cfg && (
                          <div className={`absolute bottom-0 left-0 right-0 px-1.5 py-1 text-center text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avancement' && (
          <div className="space-y-4">
            {avChantiers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="text-base font-medium">Aucun chantier en cours</p>
              </div>
            ) : (
              avChantiers.map((item, idx) => {
                const days = daysRemaining(item.chantier.date_fin_prevue)
                const isLate = days !== null && days < 0
                const isUrgent = days !== null && days >= 0 && days <= 7
                const changed = item.value !== (item.chantier.avancement ?? 0)

                return (
                  <div key={item.chantier.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <HardHat className="w-5 h-5 text-slate-500 flex-shrink-0" />
                          <h3 className="text-lg font-bold text-slate-900 truncate">{item.chantier.nom}</h3>
                        </div>
                        {item.chantier.ville && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.chantier.ville}
                          </p>
                        )}
                        {item.chantier.chef_chantier_nom && (
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {item.chantier.chef_chantier_nom}
                          </p>
                        )}
                      </div>
                      <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold ${
                        isLate
                          ? 'bg-red-100 text-red-700'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.value}%
                      </div>
                    </div>

                    <div>
                      <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
                        <div
                          className={`h-4 rounded-full transition-all duration-300 ${
                            item.value >= 100
                              ? 'bg-emerald-500'
                              : item.value >= 75
                              ? 'bg-blue-500'
                              : item.value >= 50
                              ? 'bg-amber-500'
                              : 'bg-slate-500'
                          }`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAdjustAvancement(idx, -5)}
                        className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center touch-manipulation"
                      >
                        <ChevronDown className="w-6 h-6 text-slate-700" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.value}
                        onChange={e => handleAvancementChange(idx, parseInt(e.target.value) || 0)}
                        className="flex-1 text-center px-4 py-4 rounded-xl border-2 border-slate-200 text-xl font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                        style={{ minHeight: 56 }}
                      />
                      <button
                        onClick={() => handleAdjustAvancement(idx, 5)}
                        className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center touch-manipulation"
                      >
                        <ChevronUp className="w-6 h-6 text-slate-700" />
                      </button>
                    </div>

                    {item.chantier.date_fin_prevue && (
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isLate
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : isUrgent
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Fin prevue : {new Date(item.chantier.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {days !== null && (
                            isLate
                              ? ` — Retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`
                              : days === 0
                              ? " — Aujourd'hui !"
                              : ` — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
                          )}
                        </span>
                        {isLate && <AlertTriangle className="w-4 h-4 flex-shrink-0 ml-auto" />}
                      </div>
                    )}

                    <button
                      onClick={() => handleSaveAvancement(idx)}
                      disabled={item.saving || !changed}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl font-bold text-base transition-all touch-manipulation ${
                        changed
                          ? 'bg-blue-600 active:bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-default'
                      } disabled:opacity-60`}
                      style={{ minHeight: 56 }}
                    >
                      {item.saving
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Sauvegarde...</>
                        : changed
                        ? <><CheckCircle2 className="w-5 h-5" /> Valider {item.value}%</>
                        : 'Aucun changement'
                      }
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb lg:left-64">
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors touch-manipulation ${
                  active
                    ? 'text-slate-900'
                    : 'text-slate-400 active:text-slate-600'
                }`}
                style={{ minHeight: 64 }}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-1 bg-slate-900 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {toast && (
        <div
          className={`fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:max-w-sm flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-base font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            : <AlertCircle className="w-6 h-6 flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}
    </AppLayout>
  )
}
