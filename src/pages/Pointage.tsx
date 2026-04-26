import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import {
  Plus, X, AlertCircle, Clock, Euro, Users, HardHat,
  Trash2, ChevronDown, Calendar, FileText, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  corps_metier: string;
  statut: string;
  taux_horaire: number;
}

interface Chantier {
  id: string;
  nom: string;
  ville: string;
  statut: string;
}

interface Pointage {
  id: string;
  user_id: string;
  employe_id: string;
  chantier_id: string;
  date: string;
  heures_travaillees: number;
  type_travail: 'normal' | 'heures_sup' | 'nuit' | 'weekend' | 'ferie';
  notes: string;
  created_at: string;
}

interface PointageEnrichi extends Pointage {
  employe: Employe | null;
  chantier: Chantier | null;
}

type PeriodFilter = 'semaine' | 'mois' | 'tout';

const TYPE_TRAVAIL_OPTIONS = [
  { value: 'normal',     label: 'Normal' },
  { value: 'heures_sup', label: 'Heures sup.' },
  { value: 'nuit',       label: 'Nuit' },
  { value: 'weekend',    label: 'Week-end' },
  { value: 'ferie',      label: 'Ferie' },
];

const TYPE_TRAVAIL_BADGES: Record<string, string> = {
  normal:     'bg-slate-100 text-slate-700',
  heures_sup: 'bg-amber-100 text-amber-700',
  nuit:       'bg-indigo-100 text-indigo-700',
  weekend:    'bg-purple-100 text-purple-700',
  ferie:      'bg-red-100 text-red-700',
};

const TYPE_TRAVAIL_LABELS: Record<string, string> = {
  normal:     'Normal',
  heures_sup: 'Heures sup.',
  nuit:       'Nuit',
  weekend:    'Week-end',
  ferie:      'Ferie',
};

const formatEuro = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const isoToday = () => new Date().toISOString().slice(0, 10);

const getWeekBounds = (ref: Date) => {
  const d = new Date(ref);
  const day = d.getDay();
  const diffMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
};

const getMonthBounds = (ref: Date) => {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const start = new Date(y, m, 1).toISOString().slice(0, 10);
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

const emptyForm = {
  employe_id: '',
  chantier_id: '',
  date: isoToday(),
  heures_travaillees: '8',
  type_travail: 'normal',
  notes: '',
};

type FormState = typeof emptyForm;

export default function Pointage() {
  const { user } = useAuth();

  const [pointages, setPointages] = useState<PointageEnrichi[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodFilter>('semaine');
  const [filterChantier, setFilterChantier] = useState('tous');
  const [referenceDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [expandedChantiers, setExpandedChantiers] = useState<Set<string>>(new Set());

  const dateRange = (() => {
    if (period === 'semaine') return getWeekBounds(referenceDate);
    if (period === 'mois') return getMonthBounds(referenceDate);
    return null;
  })();

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: pData }, { data: eData }, { data: cData }] = await Promise.all([
      supabase
        .from('pointages')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('employes')
        .select('id, nom, prenom, corps_metier, statut, taux_horaire')
        .eq('user_id', user.id),
      supabase
        .from('chantiers')
        .select('id, nom, ville, statut')
        .eq('user_id', user.id),
    ]);

    const emp: Employe[] = eData || [];
    const chan: Chantier[] = cData || [];
    setEmployes(emp);
    setChantiers(chan);

    const empMap = new Map(emp.map(e => [e.id, e]));
    const chanMap = new Map(chan.map(c => [c.id, c]));

    const enriched: PointageEnrichi[] = (pData || []).map(p => ({
      ...p,
      employe: empMap.get(p.employe_id) ?? null,
      chantier: chanMap.get(p.chantier_id) ?? null,
    }));

    setPointages(enriched);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [user]);

  const chantiersActifs = chantiers.filter(c => c.statut === 'en_cours' || c.statut === 'planifie');

  const filteredPointages = pointages.filter(p => {
    const inPeriod = !dateRange || (p.date >= dateRange.start && p.date <= dateRange.end);
    const inChantier = filterChantier === 'tous' || p.chantier_id === filterChantier;
    return inPeriod && inChantier;
  });

  const totalHeuresSemaine = (() => {
    const bounds = getWeekBounds(referenceDate);
    return pointages
      .filter(p => p.date >= bounds.start && p.date <= bounds.end)
      .reduce((s, p) => s + Number(p.heures_travaillees), 0);
  })();

  const coutMOSemaine = (() => {
    const bounds = getWeekBounds(referenceDate);
    return pointages
      .filter(p => p.date >= bounds.start && p.date <= bounds.end)
      .reduce((s, p) => s + Number(p.heures_travaillees) * Number(p.employe?.taux_horaire ?? 0), 0);
  })();

  const nbEmployesSemaine = (() => {
    const bounds = getWeekBounds(referenceDate);
    return new Set(
      pointages
        .filter(p => p.date >= bounds.start && p.date <= bounds.end)
        .map(p => p.employe_id)
    ).size;
  })();

  const groupedByChantier = filteredPointages.reduce<Record<string, PointageEnrichi[]>>((acc, p) => {
    const key = p.chantier_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const syntheseParEmploye = (() => {
    const map = new Map<string, { employe: Employe; heures: number; cout: number }>();
    filteredPointages.forEach(p => {
      if (!p.employe) return;
      const existing = map.get(p.employe_id);
      const heures = Number(p.heures_travaillees);
      const cout = heures * Number(p.employe.taux_horaire ?? 0);
      if (existing) {
        existing.heures += heures;
        existing.cout += cout;
      } else {
        map.set(p.employe_id, { employe: p.employe, heures, cout });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.heures - a.heures);
  })();

  const toggleChantier = (id: string) => {
    setExpandedChantiers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openModal = () => {
    setForm({ ...emptyForm, date: isoToday() });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.employe_id) { setError('Selectionnez un employe'); return; }
    if (!form.chantier_id) { setError('Selectionnez un chantier'); return; }
    if (!form.date) { setError('Renseignez la date'); return; }
    const heures = parseFloat(form.heures_travaillees);
    if (isNaN(heures) || heures < 0.5 || heures > 24) {
      setError('Les heures doivent etre entre 0.5 et 24');
      return;
    }
    setSaving(true);
    setError('');
    const { error: dbErr } = await supabase.from('pointages').insert({
      user_id: user!.id,
      employe_id: form.employe_id,
      chantier_id: form.chantier_id,
      date: form.date,
      heures_travaillees: heures,
      type_travail: form.type_travail,
      notes: form.notes.trim() || null,
    });
    if (dbErr) {
      setError(dbErr.message);
      setSaving(false);
      return;
    }
    await loadAll();
    setSaving(false);
    setShowModal(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('pointages').delete().eq('id', deleteId);
    setDeleteId(null);
    await loadAll();
  };

  const periodLabel = period === 'semaine'
    ? dateRange ? `Sem. du ${formatDate(dateRange.start)} au ${formatDate(dateRange.end)}` : ''
    : period === 'mois'
    ? dateRange ? `${new Date(dateRange.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : ''
    : 'Toute la periode';

  return (
    <AppLayout title="Pointage" description="Suivi des heures de travail par employe et chantier">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {(['semaine', 'mois', 'tout'] as PeriodFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === 'semaine' ? 'Cette semaine' : p === 'mois' ? 'Ce mois' : 'Tout'}
            </button>
          ))}
          <select
            value={filterChantier}
            onChange={e => setFilterChantier(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="tous">Tous les chantiers</option>
            {chantiers.map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau pointage
        </Button>
      </div>

      {/* Periode label */}
      {periodLabel && (
        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {periodLabel}
        </p>
      )}

      {/* Stats semaine */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card padding="none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Heures cette semaine</p>
              <p className="text-2xl font-bold text-slate-900">{totalHeuresSemaine.toFixed(1)}<span className="text-base font-normal text-slate-500 ml-1">h</span></p>
            </div>
          </CardContent>
        </Card>
        <Card padding="none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 flex-shrink-0">
              <Euro className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Cout MO semaine</p>
              <p className="text-2xl font-bold text-slate-900">{formatEuro(coutMOSemaine)}</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-50 flex-shrink-0">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Employes pointes</p>
              <p className="text-2xl font-bold text-slate-900">{nbEmployesSemaine}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal groupé par chantier */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filteredPointages.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center">
            <HardHat className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">Aucun pointage pour cette periode</p>
            <Button onClick={openModal}><Plus className="w-4 h-4 mr-2" />Ajouter un pointage</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {Object.entries(groupedByChantier).map(([chantierId, lignes]) => {
            const chantier = lignes[0]?.chantier;
            const totalH = lignes.reduce((s, l) => s + Number(l.heures_travaillees), 0);
            const totalC = lignes.reduce((s, l) => s + Number(l.heures_travaillees) * Number(l.employe?.taux_horaire ?? 0), 0);
            const isOpen = expandedChantiers.has(chantierId);

            return (
              <Card key={chantierId} padding="none">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors rounded-t-xl"
                  onClick={() => toggleChantier(chantierId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                      <HardHat className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{chantier?.nom ?? 'Chantier inconnu'}</p>
                      {chantier?.ville && <p className="text-xs text-slate-500">{chantier.ville}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-5 text-sm">
                      <span className="text-slate-500">{lignes.length} ligne{lignes.length > 1 ? 's' : ''}</span>
                      <span className="font-semibold text-slate-800">{totalH.toFixed(1)} h</span>
                      <span className="font-semibold text-emerald-700">{formatEuro(totalC)}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employe</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Heures</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cout</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Notes</th>
                          <th className="px-4 py-3 w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lignes.map(p => {
                          const heures = Number(p.heures_travaillees);
                          const taux = Number(p.employe?.taux_horaire ?? 0);
                          const cout = heures * taux;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {p.employe ? `${p.employe.prenom} ${p.employe.nom}` : '—'}
                                  </p>
                                  {p.employe?.corps_metier && (
                                    <p className="text-xs text-slate-500">{p.employe.corps_metier}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.date)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-800">{heures.toFixed(1)} h</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_TRAVAIL_BADGES[p.type_travail] ?? 'bg-slate-100 text-slate-700'}`}>
                                  {TYPE_TRAVAIL_LABELS[p.type_travail] ?? p.type_travail}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">{formatEuro(cout)}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate hidden md:table-cell">
                                {p.notes || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setDeleteId(p.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-slate-500">Total chantier</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{totalH.toFixed(1)} h</td>
                          <td />
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatEuro(totalC)}</td>
                          <td className="hidden md:table-cell" />
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Synthese par employe */}
      {syntheseParEmploye.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h2 className="font-semibold text-slate-900 text-sm">Synthese par employe</h2>
            <span className="text-xs text-slate-400 ml-1">— {periodLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Corps de metier</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Taux / h</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Heures totales</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cout total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syntheseParEmploye.map(({ employe, heures, cout }) => (
                  <tr key={employe.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {employe.prenom} {employe.nom}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{employe.corps_metier || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatEuro(Number(employe.taux_horaire))}/h</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{heures.toFixed(1)} h</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatEuro(cout)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {syntheseParEmploye.reduce((s, r) => s + r.heures, 0).toFixed(1)} h
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">
                    {formatEuro(syntheseParEmploye.reduce((s, r) => s + r.cout, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Modal nouveau pointage */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Nouveau pointage</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Employe *</label>
                <select
                  value={form.employe_id}
                  onChange={e => setForm(f => ({ ...f, employe_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="">Selectionnez un employe</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom}{e.corps_metier ? ` — ${e.corps_metier}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chantier *</label>
                <select
                  value={form.chantier_id}
                  onChange={e => setForm(f => ({ ...f, chantier_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="">Selectionnez un chantier</option>
                  {chantiersActifs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom}{c.ville ? ` — ${c.ville}` : ''}
                    </option>
                  ))}
                </select>
                {chantiersActifs.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">Aucun chantier en cours ou planifie.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Heures *</label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={form.heures_travaillees}
                    onChange={e => setForm(f => ({ ...f, heures_travaillees: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type de travail</label>
                <select
                  value={form.type_travail}
                  onChange={e => setForm(f => ({ ...f, type_travail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {TYPE_TRAVAIL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Observations, remarques..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
                />
              </div>

              {form.employe_id && form.heures_travaillees && (() => {
                const emp = employes.find(e => e.id === form.employe_id);
                const h = parseFloat(form.heures_travaillees);
                if (!emp || isNaN(h)) return null;
                const cout = h * Number(emp.taux_horaire ?? 0);
                return (
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-sm text-emerald-700">Cout calcule</span>
                    <span className="font-bold text-emerald-800">{formatEuro(cout)}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Supprimer ce pointage ?</h2>
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
