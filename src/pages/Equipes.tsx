import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import {
  Users, Plus, Search, Phone, Mail, HardHat, Wrench,
  Zap, Droplets, PaintBucket, Hammer, Truck, X, AlertCircle,
  Pencil, Trash2, CheckCircle2, Clock, PauseCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const CORPS_METIER = [
  { value: 'macon',              label: 'Macon',               icon: Hammer },
  { value: 'charpentier',        label: 'Charpentier',         icon: Hammer },
  { value: 'electricien',        label: 'Electricien',         icon: Zap },
  { value: 'plombier',           label: 'Plombier',            icon: Droplets },
  { value: 'peintre',            label: 'Peintre',             icon: PaintBucket },
  { value: 'carreleur',          label: 'Carreleur',           icon: Hammer },
  { value: 'menuisier',          label: 'Menuisier',           icon: Hammer },
  { value: 'conducteur_travaux', label: 'Conducteur travaux',  icon: HardHat },
  { value: 'chef_chantier',      label: 'Chef chantier',       icon: HardHat },
  { value: 'grutier',            label: 'Grutier',             icon: Truck },
  { value: 'coffreur',           label: 'Coffreur',            icon: Wrench },
  { value: 'soudeur',            label: 'Soudeur',             icon: Wrench },
  { value: 'autre',              label: 'Autre',               icon: Wrench },
];

const STATUT_EMPLOYE = [
  { value: 'disponible',  label: 'Disponible',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  { value: 'en_chantier', label: 'En chantier',  color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  { value: 'conge',       label: 'En conge',     color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  { value: 'arret',       label: 'Arret',        color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
];

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  corps_metier: string;
  statut: string;
  chantier_actuel_id: string | null;
  taux_horaire: number;
}

interface Chantier {
  id: string;
  nom: string;
}

const emptyForm = {
  nom: '', prenom: '', email: '', telephone: '',
  corps_metier: 'macon', statut: 'disponible',
  chantier_actuel_id: '', taux_horaire: '',
};

type FormState = typeof emptyForm;

const getInitials = (prenom: string, nom: string) => `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700', 'bg-rose-100 text-rose-700', 'bg-slate-100 text-slate-700',
];

export default function Equipes() {
  const { user } = useAuth();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterMetier, setFilterMetier] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: em }, { data: ch }] = await Promise.all([
      supabase.from('employes').select('*').eq('user_id', user.id).order('nom'),
      supabase.from('chantiers').select('id,nom').eq('user_id', user.id).in('statut', ['planifie','en_cours']),
    ]);
    setEmployes(em || []);
    setChantiers(ch || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit = (e: Employe) => {
    setForm({
      nom: e.nom, prenom: e.prenom, email: e.email, telephone: e.telephone,
      corps_metier: e.corps_metier, statut: e.statut,
      chantier_actuel_id: e.chantier_actuel_id || '',
      taux_horaire: String(e.taux_horaire || ''),
    });
    setEditId(e.id); setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) { setError('Le nom et prenom sont obligatoires'); return; }
    setSaving(true); setError('');
    const payload = {
      nom: form.nom.trim(), prenom: form.prenom.trim(), email: form.email.trim(),
      telephone: form.telephone.trim(), corps_metier: form.corps_metier,
      statut: form.statut,
      chantier_actuel_id: form.chantier_actuel_id || null,
      taux_horaire: parseFloat(form.taux_horaire) || 0,
    };
    if (editId) {
      await supabase.from('employes').update(payload).eq('id', editId);
    } else {
      await supabase.from('employes').insert({ ...payload, user_id: user!.id });
    }
    await load(); setSaving(false); setShowModal(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('employes').delete().eq('id', deleteId);
    setDeleteId(null);
    await load();
  };

  const filtered = employes.filter(e => {
    const matchStatut = filterStatut === 'tous' || e.statut === filterStatut;
    const matchMetier = filterMetier === 'tous' || e.corps_metier === filterMetier;
    const matchSearch = !search || `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()) || e.corps_metier.toLowerCase().includes(search.toLowerCase());
    return matchStatut && matchMetier && matchSearch;
  });

  const getStatut = (v: string) => STATUT_EMPLOYE.find(s => s.value === v) || STATUT_EMPLOYE[0];
  const getMetier = (v: string) => CORPS_METIER.find(m => m.value === v) || CORPS_METIER[CORPS_METIER.length - 1];
  const getChantierNom = (id: string | null) => id ? chantiers.find(c => c.id === id)?.nom || '—' : '—';

  const metiersPresents = [...new Set(employes.map(e => e.corps_metier))];

  const statsStatuts = STATUT_EMPLOYE.map(s => ({ ...s, count: employes.filter(e => e.statut === s.value).length }));

  return (
    <AppLayout title="Equipes" description="Gestion de vos employes et de leurs affectations">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsStatuts.map(s => (
          <button key={s.value} onClick={() => setFilterStatut(filterStatut === s.value ? 'tous' : s.value)} className={`p-4 rounded-xl border-2 text-left transition-all ${filterStatut === s.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <p className={`text-2xl font-bold mb-1 ${filterStatut === s.value ? 'text-white' : ''}`}>{s.count}</p>
            <p className={`text-xs ${filterStatut === s.value ? 'text-slate-300' : 'text-slate-500'}`}>{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterMetier('tous')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMetier === 'tous' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Tous metiers</button>
          {metiersPresents.map(m => {
            const metier = getMetier(m);
            return <button key={m} onClick={() => setFilterMetier(filterMetier === m ? 'tous' : m)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMetier === m ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{metier.label}</button>;
          })}
        </div>
        <Button onClick={openNew} className="flex-shrink-0"><Plus className="w-4 h-4 mr-2" />Ajouter un employe</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employe..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-6">{search ? 'Aucun employe ne correspond' : 'Aucun employe pour le moment'}</p>
          {!search && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Ajouter votre premier employe</Button>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, idx) => {
            const statut = getStatut(e.statut);
            const metier = getMetier(e.corps_metier);
            const MetierIcon = metier.icon;
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <Card key={e.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                      {getInitials(e.prenom, e.nom)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{e.prenom} {e.nom}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MetierIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <p className="text-xs text-slate-500 truncate">{metier.label}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />{statut.label}
                    </span>
                  </div>

                  {e.statut === 'en_chantier' && e.chantier_actuel_id && (
                    <div className="flex items-center gap-1.5 px-2.5 py-2 bg-blue-50 rounded-lg mb-3 text-xs text-blue-700">
                      <HardHat className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{getChantierNom(e.chantier_actuel_id)}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-500">
                    {e.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span className="truncate">{e.email}</span></div>}
                    {e.telephone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />{e.telephone}</div>}
                    {e.taux_horaire > 0 && <div className="flex items-center gap-1.5"><span className="text-slate-400">€</span>{e.taux_horaire.toFixed(2)}/h</div>}
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">{editId ? 'Modifier l\'employe' : 'Nouvel employe'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prenom *</label>
                  <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telephone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Corps de metier</label>
                  <select value={form.corps_metier} onChange={e => setForm(f => ({ ...f, corps_metier: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white">
                    {CORPS_METIER.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Taux horaire (€/h)</label>
                  <input type="number" min="0" step="0.5" value={form.taux_horaire} onChange={e => setForm(f => ({ ...f, taux_horaire: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white">
                    {STATUT_EMPLOYE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Chantier actuel</label>
                  <select value={form.chantier_actuel_id} onChange={e => setForm(f => ({ ...f, chantier_actuel_id: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white">
                    <option value="">— Aucun —</option>
                    {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Supprimer cet employe ?</h2>
            <p className="text-sm text-slate-500 mb-6">Cette action est irreversible.</p>
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
