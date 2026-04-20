import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button, Input } from '../components/ui';
import {
  HardHat, Plus, Search, MapPin, Euro, Calendar, Users,
  ChevronRight, X, AlertCircle, CheckCircle2, Clock, PauseCircle,
  Pencil, Trash2, TrendingUp, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const STATUT_OPTIONS = [
  { value: 'planifie',  label: 'Planifie',   color: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-400' },
  { value: 'en_cours',  label: 'En cours',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { value: 'pause',     label: 'En pause',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  { value: 'termine',   label: 'Termine',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { value: 'annule',    label: 'Annule',     color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
];

const STATUT_ICONS: Record<string, React.ElementType> = {
  planifie: Clock, en_cours: HardHat, pause: PauseCircle, termine: CheckCircle2, annule: X,
};

interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  statut: string;
  date_debut: string | null;
  date_fin_prevue: string | null;
  budget_prevu: number;
  budget_consomme: number;
  client_nom: string;
  client_contact: string;
  chef_chantier_nom: string;
  description: string;
  avancement: number;
  created_at: string;
}

const emptyForm = {
  nom: '', adresse: '', ville: '', code_postal: '', statut: 'planifie',
  date_debut: '', date_fin_prevue: '', budget_prevu: '', budget_consomme: '0',
  client_nom: '', client_contact: '', chef_chantier_nom: '', description: '', avancement: '0',
};

type FormState = typeof emptyForm;

const formatEuro = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Chantiers() {
  const { user } = useAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Chantier | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('chantiers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setChantiers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (c: Chantier) => {
    setForm({
      nom: c.nom, adresse: c.adresse, ville: c.ville, code_postal: c.code_postal, statut: c.statut,
      date_debut: c.date_debut || '', date_fin_prevue: c.date_fin_prevue || '',
      budget_prevu: String(c.budget_prevu || 0), budget_consomme: String(c.budget_consomme || 0),
      client_nom: c.client_nom, client_contact: c.client_contact, chef_chantier_nom: c.chef_chantier_nom,
      description: c.description, avancement: String(c.avancement),
    });
    setEditId(c.id); setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.nom.trim()) { setError('Le nom du chantier est obligatoire'); return; }
    setSaving(true); setError('');
    const payload = {
      nom: form.nom.trim(), adresse: form.adresse.trim(), ville: form.ville.trim(),
      code_postal: form.code_postal.trim(), statut: form.statut,
      date_debut: form.date_debut || null, date_fin_prevue: form.date_fin_prevue || null,
      budget_prevu: parseFloat(form.budget_prevu) || 0, budget_consomme: parseFloat(form.budget_consomme) || 0,
      client_nom: form.client_nom.trim(), client_contact: form.client_contact.trim(),
      chef_chantier_nom: form.chef_chantier_nom.trim(), description: form.description.trim(),
      avancement: parseInt(form.avancement) || 0,
    };
    if (editId) {
      await supabase.from('chantiers').update(payload).eq('id', editId);
    } else {
      await supabase.from('chantiers').insert({ ...payload, user_id: user!.id });
    }
    await load(); setSaving(false); setShowModal(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('chantiers').delete().eq('id', deleteId);
    setDeleteId(null);
    if (selected?.id === deleteId) setSelected(null);
    await load();
  };

  const filtered = chantiers.filter(c => {
    const matchFilter = filter === 'tous' || c.statut === filter;
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || c.ville.toLowerCase().includes(search.toLowerCase()) || c.client_nom.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts: Record<string, number> = { tous: chantiers.length };
  STATUT_OPTIONS.forEach(s => { counts[s.value] = chantiers.filter(c => c.statut === s.value).length; });

  const getStatut = (v: string) => STATUT_OPTIONS.find(s => s.value === v) || STATUT_OPTIONS[0];
  const today = new Date();

  return (
    <AppLayout title="Chantiers" description="Gestion et suivi de tous vos chantiers">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('tous')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'tous' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            Tous ({counts.tous})
          </button>
          {STATUT_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setFilter(s.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s.value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s.label} ({counts[s.value] || 0})
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />Nouveau chantier
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un chantier, une ville, un client..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <HardHat className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-6">{search ? 'Aucun chantier ne correspond a votre recherche' : 'Aucun chantier pour le moment'}</p>
          {!search && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Creer votre premier chantier</Button>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(c => {
            const s = getStatut(c.statut);
            const StatutIcon = STATUT_ICONS[c.statut] || HardHat;
            const budgetPct = c.budget_prevu > 0 ? Math.round((c.budget_consomme / c.budget_prevu) * 100) : 0;
            const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
            const diff = fin ? Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
            const isLate = c.statut === 'en_cours' && diff !== null && diff < 0;
            return (
              <Card key={c.id} className={`hover:shadow-md transition-all cursor-pointer group ${selected?.id === c.id ? 'ring-2 ring-slate-900' : ''}`} onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0"><HardHat className="w-4 h-4 text-slate-600" /></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.nom}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.ville || '—'}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                    </span>
                  </div>

                  {c.client_nom && <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><Building2 className="w-3 h-3" />{c.client_nom}</p>}

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Avancement</span>
                      <span className="font-medium text-slate-700">{c.avancement}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.avancement === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${c.avancement}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-400 mb-0.5">Budget prevu</p>
                      <p className="font-semibold text-slate-700">{formatEuro(c.budget_prevu)}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${budgetPct > 90 ? 'bg-red-50' : budgetPct > 70 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      <p className="text-slate-400 mb-0.5">Consomme</p>
                      <p className={`font-semibold ${budgetPct > 90 ? 'text-red-600' : budgetPct > 70 ? 'text-amber-600' : 'text-slate-700'}`}>{budgetPct}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {fin ? (
                        <span className={isLate ? 'text-red-600 font-medium' : diff! <= 7 ? 'text-amber-600 font-medium' : ''}>
                          {isLate ? `Retard ${Math.abs(diff!)}j` : `Fin ${formatDate(c.date_fin_prevue)}`}
                        </span>
                      ) : 'Pas de date'}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {selected?.id === c.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      {c.adresse && <p className="flex gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{c.adresse}, {c.code_postal} {c.ville}</p>}
                      {c.chef_chantier_nom && <p className="flex gap-1.5"><Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Chef : {c.chef_chantier_nom}</p>}
                      {c.client_contact && <p className="flex gap-1.5"><Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Contact : {c.client_contact}</p>}
                      {c.date_debut && <p className="flex gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Debut : {formatDate(c.date_debut)}</p>}
                      {c.description && <p className="text-slate-500 mt-2 line-clamp-3">{c.description}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Modifier le chantier' : 'Nouveau chantier'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du chantier *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Ex: Construction maison individuelle..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white">
                    {STATUT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Avancement (%)</label>
                  <input type="number" min="0" max="100" value={form.avancement} onChange={e => setForm(f => ({ ...f, avancement: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
                  <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Rue, numero..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ville</label>
                  <input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Paris..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Code postal</label>
                  <input value={form.code_postal} onChange={e => setForm(f => ({ ...f, code_postal: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="75001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de debut</label>
                  <input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de fin prevue</label>
                  <input type="date" value={form.date_fin_prevue} onChange={e => setForm(f => ({ ...f, date_fin_prevue: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget prevu (€)</label>
                  <input type="number" min="0" value={form.budget_prevu} onChange={e => setForm(f => ({ ...f, budget_prevu: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget consomme (€)</label>
                  <input type="number" min="0" value={form.budget_consomme} onChange={e => setForm(f => ({ ...f, budget_consomme: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du client</label>
                  <input value={form.client_nom} onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="SCI Martin..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact client</label>
                  <input value={form.client_contact} onChange={e => setForm(f => ({ ...f, client_contact: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="06 XX XX XX XX" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Chef de chantier</label>
                  <input value={form.chef_chantier_nom} onChange={e => setForm(f => ({ ...f, chef_chantier_nom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" placeholder="Jean Dupont..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none" placeholder="Description du chantier, nature des travaux..." />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Creer le chantier'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Supprimer ce chantier ?</h2>
            <p className="text-sm text-slate-500 mb-6">Cette action est irreversible. Toutes les taches associees seront aussi supprimees.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
              <Button variant="danger" onClick={confirmDelete}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
