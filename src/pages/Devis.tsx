import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import {
  FileText, Plus, Search, Euro, Calendar, ChevronRight, X,
  AlertCircle, CheckCircle2, Clock, Send, Ban, AlertTriangle,
  Pencil, Trash2, TrendingUp, Building2, ArrowRight, CreditCard,
  ClipboardList, ReceiptText, RefreshCw, Plus as PlusIcon,
  Minus, ChevronDown, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Chantier {
  id: string;
  nom: string;
  ville: string;
}

interface LigneDevis {
  id?: string;
  ordre: number;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire_ht: number;
  tva_pct: number;
  montant_ht: number;
}

interface Devis {
  id: string;
  user_id: string;
  chantier_id: string | null;
  numero: string;
  client_nom: string;
  client_email: string;
  client_adresse: string;
  objet: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  montant_ht: number;
  taux_tva: number;
  montant_ttc: number;
  date_emission: string;
  date_validite: string;
  notes: string;
  conditions: string;
  created_at: string;
  updated_at: string;
  chantiers?: { nom: string; ville: string } | null;
  lignes_devis?: LigneDevis[];
}

interface Facture {
  id: string;
  user_id: string;
  devis_id: string | null;
  chantier_id: string | null;
  numero: string;
  client_nom: string;
  client_email: string;
  client_adresse: string;
  objet: string;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee';
  montant_ht: number;
  taux_tva: number;
  montant_ttc: number;
  montant_paye: number;
  date_emission: string;
  date_echeance: string;
  date_paiement: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  chantiers?: { nom: string; ville: string } | null;
}

/* ─────────────────────────────────────────────
   Config statuts
───────────────────────────────────────────── */
const STATUT_DEVIS: Record<string, { label: string; color: string; dot: string }> = {
  brouillon: { label: 'Brouillon',  color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  envoye:    { label: 'Envoyé',     color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  accepte:   { label: 'Accepté',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  refuse:    { label: 'Refusé',     color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  expire:    { label: 'Expiré',     color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

const STATUT_FACTURE: Record<string, { label: string; color: string; dot: string }> = {
  brouillon: { label: 'Brouillon',  color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  envoyee:   { label: 'Envoyée',    color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  payee:     { label: 'Payée',      color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  retard:    { label: 'En retard',  color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  annulee:   { label: 'Annulée',    color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

const NEXT_STATUT_DEVIS: Partial<Record<string, string>> = {
  brouillon: 'envoye',
  envoye: 'accepte',
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const today = () => new Date().toISOString().split('T')[0];

const newLigne = (ordre: number): LigneDevis => ({
  ordre, description: '', quantite: 1, unite: 'u', prix_unitaire_ht: 0, tva_pct: 20, montant_ht: 0,
});

const calcLigne = (l: LigneDevis): LigneDevis => ({
  ...l, montant_ht: +(l.quantite * l.prix_unitaire_ht).toFixed(2),
});

const calcTotaux = (lignes: LigneDevis[]) => {
  const ht = lignes.reduce((s, l) => s + l.montant_ht, 0);
  const tva = lignes.reduce((s, l) => s + l.montant_ht * (l.tva_pct / 100), 0);
  return { ht: +ht.toFixed(2), tva: +tva.toFixed(2), ttc: +(ht + tva).toFixed(2) };
};

/* ─────────────────────────────────────────────
   Formulaire devis/facture
───────────────────────────────────────────── */
type FormMode = 'devis' | 'facture';

interface FormData {
  chantier_id: string;
  client_nom: string;
  client_email: string;
  client_adresse: string;
  objet: string;
  date_emission: string;
  date_validite: string;   // for devis
  date_echeance: string;   // for facture
  notes: string;
  conditions: string;
  lignes: LigneDevis[];
  // facture only
  montant_paye: string;
  date_paiement: string;
}

const emptyForm = (): FormData => ({
  chantier_id: '',
  client_nom: '', client_email: '', client_adresse: '',
  objet: '',
  date_emission: today(),
  date_validite: '',
  date_echeance: '',
  notes: '', conditions: '',
  lignes: [newLigne(1)],
  montant_paye: '0',
  date_paiement: '',
});

/* ─────────────────────────────────────────────
   Composant Badge statut
───────────────────────────────────────────── */
function StatutBadge({ statut, map }: { statut: string; map: Record<string, { label: string; color: string; dot: string }> }) {
  const cfg = map[statut] || { label: statut, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Composant Ligne devis (tableau)
───────────────────────────────────────────── */
function LigneRow({
  ligne, idx, onChange, onRemove, canRemove,
}: {
  ligne: LigneDevis;
  idx: number;
  onChange: (idx: number, l: LigneDevis) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const set = (field: keyof LigneDevis, val: string | number) => {
    const updated = calcLigne({ ...ligne, [field]: val });
    onChange(idx, updated);
  };

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-2">
        <input
          value={ligne.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Description du poste..."
          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </td>
      <td className="py-2 pr-2 w-20">
        <input
          type="number" min="0" step="0.01"
          value={ligne.quantite}
          onChange={e => set('quantite', parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </td>
      <td className="py-2 pr-2 w-20">
        <input
          value={ligne.unite}
          onChange={e => set('unite', e.target.value)}
          placeholder="u"
          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </td>
      <td className="py-2 pr-2 w-28">
        <input
          type="number" min="0" step="0.01"
          value={ligne.prix_unitaire_ht}
          onChange={e => set('prix_unitaire_ht', parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </td>
      <td className="py-2 pr-2 w-20">
        <input
          type="number" min="0" max="100" step="0.1"
          value={ligne.tva_pct}
          onChange={e => set('tva_pct', parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </td>
      <td className="py-2 pr-2 w-28 text-right">
        <span className="text-sm font-medium text-slate-700">
          {fmt(ligne.montant_ht)}
        </span>
      </td>
      <td className="py-2 w-8">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────
   Modal formulaire
───────────────────────────────────────────── */
function FormModal({
  mode,
  editId,
  chantiers,
  initialForm,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  editId: string | null;
  chantiers: Chantier[];
  initialForm: FormData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totaux = calcTotaux(form.lignes);

  const set = (field: keyof FormData, val: string) =>
    setForm(f => ({ ...f, [field]: val }));

  const updateLigne = (idx: number, l: LigneDevis) =>
    setForm(f => { const ls = [...f.lignes]; ls[idx] = l; return { ...f, lignes: ls }; });

  const addLigne = () =>
    setForm(f => ({ ...f, lignes: [...f.lignes, newLigne(f.lignes.length + 1)] }));

  const removeLigne = (idx: number) =>
    setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx).map((l, i) => ({ ...l, ordre: i + 1 })) }));

  const save = async () => {
    if (!form.client_nom.trim()) { setError('Le nom du client est obligatoire'); return; }
    if (!form.objet.trim()) { setError("L'objet est obligatoire"); return; }
    setSaving(true); setError('');

    if (mode === 'devis') {
      const payload = {
        user_id: user!.id,
        chantier_id: form.chantier_id || null,
        client_nom: form.client_nom.trim(),
        client_email: form.client_email.trim(),
        client_adresse: form.client_adresse.trim(),
        objet: form.objet.trim(),
        statut: 'brouillon' as const,
        montant_ht: totaux.ht,
        taux_tva: 20,
        montant_ttc: totaux.ttc,
        date_emission: form.date_emission || today(),
        date_validite: form.date_validite || null,
        notes: form.notes.trim(),
        conditions: form.conditions.trim(),
      };

      let devisId = editId;
      if (editId) {
        const { error: err } = await supabase.from('devis').update(payload).eq('id', editId);
        if (err) { setError(err.message); setSaving(false); return; }
        await supabase.from('lignes_devis').delete().eq('devis_id', editId);
      } else {
        // Generate numero
        const { count } = await supabase.from('devis').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
        const numero = `DEV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;
        const { data, error: err } = await supabase.from('devis').insert({ ...payload, numero }).select('id').single();
        if (err || !data) { setError(err?.message || 'Erreur'); setSaving(false); return; }
        devisId = data.id;
      }

      // Insert lines
      const lignesPayload = form.lignes
        .filter(l => l.description.trim())
        .map(l => ({
          user_id: user!.id,
          devis_id: devisId,
          ordre: l.ordre,
          description: l.description.trim(),
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire_ht: l.prix_unitaire_ht,
          tva_pct: l.tva_pct,
          montant_ht: l.montant_ht,
        }));
      if (lignesPayload.length > 0) {
        await supabase.from('lignes_devis').insert(lignesPayload);
      }

    } else {
      const payload = {
        user_id: user!.id,
        chantier_id: form.chantier_id || null,
        client_nom: form.client_nom.trim(),
        client_email: form.client_email.trim(),
        client_adresse: form.client_adresse.trim(),
        objet: form.objet.trim(),
        statut: 'brouillon' as const,
        montant_ht: totaux.ht,
        taux_tva: 20,
        montant_ttc: totaux.ttc,
        montant_paye: parseFloat(form.montant_paye) || 0,
        date_emission: form.date_emission || today(),
        date_echeance: form.date_echeance || null,
        date_paiement: form.date_paiement || null,
        notes: form.notes.trim(),
      };

      if (editId) {
        const { error: err } = await supabase.from('factures').update(payload).eq('id', editId);
        if (err) { setError(err.message); setSaving(false); return; }
      } else {
        const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
        const numero = `FAC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;
        const { error: err } = await supabase.from('factures').insert({ ...payload, numero });
        if (err) { setError(err.message); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {editId
              ? `Modifier le ${mode === 'devis' ? 'devis' : 'la facture'}`
              : `Nouveau ${mode === 'devis' ? 'devis' : 'la facture'}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Client + chantier */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chantier lié (optionnel)</label>
                <select
                  value={form.chantier_id}
                  onChange={e => set('chantier_id', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="">Aucun chantier</option>
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du client *</label>
                <input
                  value={form.client_nom}
                  onChange={e => set('client_nom', e.target.value)}
                  placeholder="SCI Martin, Jean Dupont..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={e => set('client_email', e.target.value)}
                  placeholder="client@exemple.fr"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
                <input
                  value={form.client_adresse}
                  onChange={e => set('client_adresse', e.target.value)}
                  placeholder="12 rue de la Paix, 75001 Paris"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>
          </div>

          {/* Infos document */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Document</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet *</label>
                <input
                  value={form.objet}
                  onChange={e => set('objet', e.target.value)}
                  placeholder="Construction extension bâtiment..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date d'émission</label>
                <input
                  type="date"
                  value={form.date_emission}
                  onChange={e => set('date_emission', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {mode === 'devis' ? 'Date de validité' : "Date d'échéance"}
                </label>
                <input
                  type="date"
                  value={mode === 'devis' ? form.date_validite : form.date_echeance}
                  onChange={e => set(mode === 'devis' ? 'date_validite' : 'date_echeance', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              {mode === 'facture' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Montant payé (€)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.montant_paye}
                      onChange={e => set('montant_paye', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de paiement</label>
                    <input
                      type="date"
                      value={form.date_paiement}
                      onChange={e => set('date_paiement', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Lignes de prestation</h3>
              <button
                type="button"
                onClick={addLigne}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2.5 font-medium">Description</th>
                    <th className="text-right px-3 py-2.5 font-medium w-20">Qté</th>
                    <th className="text-left px-3 py-2.5 font-medium w-20">Unité</th>
                    <th className="text-right px-3 py-2.5 font-medium w-28">Prix HT</th>
                    <th className="text-right px-3 py-2.5 font-medium w-20">TVA %</th>
                    <th className="text-right px-3 py-2.5 font-medium w-28">Montant HT</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {form.lignes.map((ligne, idx) => (
                    <LigneRow
                      key={idx}
                      ligne={ligne}
                      idx={idx}
                      onChange={updateLigne}
                      onRemove={removeLigne}
                      canRemove={form.lignes.length > 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total HT</span>
                  <span className="font-medium">{fmt(totaux.ht)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>TVA</span>
                  <span className="font-medium">{fmt(totaux.tva)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total TTC</span>
                  <span>{fmt(totaux.ttc)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes internes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Remarques, commentaires..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            {mode === 'devis' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Conditions</label>
                <textarea
                  value={form.conditions}
                  onChange={e => set('conditions', e.target.value)}
                  rows={3}
                  placeholder="Conditions de paiement, délais, garanties..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={save} loading={saving}>
            {editId ? 'Enregistrer les modifications' : `Créer le ${mode === 'devis' ? 'devis' : 'la facture'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal détail devis
───────────────────────────────────────────── */
function DevisDetailModal({ devis, onClose }: { devis: Devis; onClose: () => void }) {
  const cfg = STATUT_DEVIS[devis.statut] || STATUT_DEVIS.brouillon;
  const lignes = devis.lignes_devis || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{devis.numero}</h2>
              <StatutBadge statut={devis.statut} map={STATUT_DEVIS} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{devis.objet}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Infos client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Client</p>
              <p className="font-semibold text-slate-900">{devis.client_nom}</p>
              {devis.client_email && <p className="text-sm text-slate-600">{devis.client_email}</p>}
              {devis.client_adresse && <p className="text-sm text-slate-500 mt-1">{devis.client_adresse}</p>}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Dates</p>
              <p className="text-sm text-slate-700"><span className="text-slate-500">Émission :</span> {fmtDate(devis.date_emission)}</p>
              <p className="text-sm text-slate-700"><span className="text-slate-500">Validité :</span> {fmtDate(devis.date_validite)}</p>
              {devis.chantiers && (
                <p className="text-sm text-slate-700 mt-1"><span className="text-slate-500">Chantier :</span> {devis.chantiers.nom}</p>
              )}
            </div>
          </div>

          {/* Lignes */}
          {lignes.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-medium">Description</th>
                    <th className="text-right px-4 py-2.5 font-medium">Qté</th>
                    <th className="text-left px-4 py-2.5 font-medium">Unité</th>
                    <th className="text-right px-4 py-2.5 font-medium">Prix HT</th>
                    <th className="text-right px-4 py-2.5 font-medium">TVA</th>
                    <th className="text-right px-4 py-2.5 font-medium">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.sort((a, b) => a.ordre - b.ordre).map((l, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-700">{l.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{l.quantite}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{l.unite}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{fmt(l.prix_unitaire_ht)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 text-right">{l.tva_pct}%</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{fmt(l.montant_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total HT</span><span>{fmt(devis.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>TVA ({devis.taux_tva}%)</span><span>{fmt(devis.montant_ttc - devis.montant_ht)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total TTC</span><span className="text-lg">{fmt(devis.montant_ttc)}</span>
              </div>
            </div>
          </div>

          {/* Notes & conditions */}
          {(devis.notes || devis.conditions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devis.notes && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{devis.notes}</p>
                </div>
              )}
              {devis.conditions && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Conditions</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{devis.conditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal confirmation suppression
───────────────────────────────────────────── */
function DeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Supprimer ce {label} ?</h2>
        <p className="text-sm text-slate-500 mb-6">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Onglet DEVIS
───────────────────────────────────────────── */
function OngletDevis({ userId, chantiers }: { userId: string; chantiers: Chantier[] }) {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [showForm, setShowForm] = useState(false);
  const [editDevis, setEditDevis] = useState<Devis | null>(null);
  const [detailDevis, setDetailDevis] = useState<Devis | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormData>(emptyForm());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('devis')
      .select('*, chantiers(nom, ville), lignes_devis(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setDevisList((data as Devis[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditDevis(null);
    setInitialForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (d: Devis) => {
    const lignes: LigneDevis[] = (d.lignes_devis && d.lignes_devis.length > 0)
      ? d.lignes_devis.sort((a, b) => a.ordre - b.ordre)
      : [newLigne(1)];
    setInitialForm({
      chantier_id: d.chantier_id || '',
      client_nom: d.client_nom,
      client_email: d.client_email,
      client_adresse: d.client_adresse,
      objet: d.objet,
      date_emission: d.date_emission,
      date_validite: d.date_validite,
      date_echeance: '',
      notes: d.notes,
      conditions: d.conditions,
      lignes,
      montant_paye: '0',
      date_paiement: '',
    });
    setEditDevis(d);
    setShowForm(true);
  };

  const changeStatut = async (id: string, newStatut: string) => {
    setActionLoading(id);
    await supabase.from('devis').update({ statut: newStatut }).eq('id', id);
    await load();
    setActionLoading(null);
  };

  const convertToFacture = async (d: Devis) => {
    setActionLoading(d.id);
    const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const numero = `FAC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;
    await supabase.from('factures').insert({
      user_id: userId,
      devis_id: d.id,
      chantier_id: d.chantier_id,
      numero,
      client_nom: d.client_nom,
      client_email: d.client_email,
      client_adresse: d.client_adresse,
      objet: d.objet,
      statut: 'brouillon',
      montant_ht: d.montant_ht,
      taux_tva: d.taux_tva,
      montant_ttc: d.montant_ttc,
      montant_paye: 0,
      date_emission: today(),
      notes: d.notes,
    });
    setActionLoading(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('lignes_devis').delete().eq('devis_id', deleteId);
    await supabase.from('devis').delete().eq('id', deleteId);
    setDeleteId(null);
    await load();
  };

  const filtered = devisList.filter(d => {
    const matchStatut = filterStatut === 'tous' || d.statut === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !search || d.client_nom.toLowerCase().includes(q) || d.numero.toLowerCase().includes(q) || d.objet.toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // Stats
  const brouillons = devisList.filter(d => d.statut === 'brouillon').length;
  const enAttente = devisList.filter(d => d.statut === 'envoye').length;
  const acceptes = devisList.filter(d => d.statut === 'accepte').length;
  const caAccepte = devisList.filter(d => d.statut === 'accepte').reduce((s, d) => s + (d.montant_ttc || 0), 0);

  const statsData = [
    { label: 'Brouillons', value: brouillons, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'En attente', value: enAttente, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Acceptés', value: acceptes, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'CA devis acceptés', value: fmt(caAccepte), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', large: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`font-bold text-slate-900 ${s.large ? 'text-lg' : 'text-2xl'}`}>{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un devis, client, objet..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['tous', ...Object.keys(STATUT_DEVIS)] as string[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatut === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s === 'tous' ? 'Tous' : STATUT_DEVIS[s]?.label}
            </button>
          ))}
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />Nouveau devis
        </Button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">{search ? 'Aucun devis ne correspond à votre recherche' : 'Aucun devis pour le moment'}</p>
          {!search && <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-2" />Créer un devis</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const nextStatut = NEXT_STATUT_DEVIS[d.statut];
            return (
              <Card key={d.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setDetailDevis(d)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{d.numero}</span>
                        <StatutBadge statut={d.statut} map={STATUT_DEVIS} />
                        {d.chantiers && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Building2 className="w-3 h-3" />{d.chantiers.nom}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="text-sm text-slate-600 font-medium">{d.client_nom}</span>
                        <span className="text-sm text-slate-400">—</span>
                        <span className="text-sm text-slate-500 truncate max-w-xs">{d.objet}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-slate-900">{fmt(d.montant_ttc)}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />{fmtDate(d.date_emission)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {actionLoading === d.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {nextStatut && (
                              <button
                                onClick={() => changeStatut(d.id, nextStatut)}
                                title={`Passer à : ${STATUT_DEVIS[nextStatut]?.label}`}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                            {d.statut === 'envoye' && (
                              <button
                                onClick={() => changeStatut(d.id, 'refuse')}
                                title="Marquer comme refusé"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {d.statut === 'accepte' && (
                              <button
                                onClick={() => convertToFacture(d)}
                                title="Convertir en facture"
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                <ReceiptText className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(d)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(d.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDetailDevis(d)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <FormModal
          mode="devis"
          editId={editDevis?.id || null}
          chantiers={chantiers}
          initialForm={initialForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
      {detailDevis && <DevisDetailModal devis={detailDevis} onClose={() => setDetailDevis(null)} />}
      {deleteId && (
        <DeleteModal
          label="devis"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Onglet FACTURES
───────────────────────────────────────────── */
function OngletFactures({ userId, chantiers }: { userId: string; chantiers: Chantier[] }) {
  const [facturesList, setFacturesList] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [showForm, setShowForm] = useState(false);
  const [editFacture, setEditFacture] = useState<Facture | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormData>(emptyForm());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('factures')
      .select('*, chantiers(nom, ville)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setFacturesList((data as Facture[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditFacture(null);
    setInitialForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (f: Facture) => {
    setInitialForm({
      chantier_id: f.chantier_id || '',
      client_nom: f.client_nom,
      client_email: f.client_email,
      client_adresse: f.client_adresse,
      objet: f.objet,
      date_emission: f.date_emission,
      date_validite: '',
      date_echeance: f.date_echeance,
      notes: f.notes,
      conditions: '',
      lignes: [newLigne(1)],
      montant_paye: String(f.montant_paye || 0),
      date_paiement: f.date_paiement || '',
    });
    setEditFacture(f);
    setShowForm(true);
  };

  const changeStatut = async (id: string, newStatut: string, extra?: Record<string, unknown>) => {
    setActionLoading(id);
    await supabase.from('factures').update({ statut: newStatut, ...extra }).eq('id', id);
    await load();
    setActionLoading(null);
  };

  const marquerPayee = async (f: Facture) => {
    await changeStatut(f.id, 'payee', { montant_paye: f.montant_ttc, date_paiement: today() });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('factures').delete().eq('id', deleteId);
    setDeleteId(null);
    await load();
  };

  const filtered = facturesList.filter(f => {
    const matchStatut = filterStatut === 'tous' || f.statut === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !search || f.client_nom.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q) || f.objet.toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // Stats
  const enAttente = facturesList.filter(f => f.statut === 'envoyee').length;
  const payees = facturesList.filter(f => f.statut === 'payee').length;
  const enRetard = facturesList.filter(f => f.statut === 'retard').length;
  const totalEncaisse = facturesList.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.montant_paye || 0), 0);

  const statsData = [
    { label: 'En attente', value: enAttente, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Payées', value: payees, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'En retard', value: enRetard, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Total encaissé', value: fmt(totalEncaisse), icon: Euro, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', large: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`font-bold text-slate-900 ${s.large ? 'text-lg' : 'text-2xl'}`}>{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une facture, client..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['tous', ...Object.keys(STATUT_FACTURE)] as string[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatut === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s === 'tous' ? 'Toutes' : STATUT_FACTURE[s]?.label}
            </button>
          ))}
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />Nouvelle facture
        </Button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">{search ? 'Aucune facture ne correspond' : 'Aucune facture pour le moment'}</p>
          {!search && <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-2" />Créer une facture</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => {
            const pct = f.montant_ttc > 0 ? Math.min(100, Math.round(((f.montant_paye || 0) / f.montant_ttc) * 100)) : 0;
            const isRetard = f.statut === 'retard' || (f.statut === 'envoyee' && f.date_echeance && new Date(f.date_echeance) < new Date());

            return (
              <Card key={f.id} className={`hover:shadow-sm transition-shadow ${isRetard && f.statut !== 'payee' ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{f.numero}</span>
                        <StatutBadge statut={f.statut} map={STATUT_FACTURE} />
                        {f.chantiers && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Building2 className="w-3 h-3" />{f.chantiers.nom}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-700">{f.client_nom}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-sm text-slate-500 truncate">{f.objet}</span>
                      </div>

                      {/* Barre paiement */}
                      {f.montant_ttc > 0 && (
                        <div className="mt-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Paiement reçu : <span className="font-medium text-slate-700">{fmt(f.montant_paye || 0)}</span></span>
                            <span className="font-medium">{pct}% — Total : {fmt(f.montant_ttc)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Date échéance */}
                      {f.date_echeance && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${isRetard && f.statut !== 'payee' ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3" />
                          Échéance : {fmtDate(f.date_echeance)}
                          {isRetard && f.statut !== 'payee' && ' — EN RETARD'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block mr-2">
                        <p className="font-bold text-slate-900">{fmt(f.montant_ttc)}</p>
                      </div>
                      {actionLoading === f.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {f.statut === 'brouillon' && (
                            <button
                              onClick={() => changeStatut(f.id, 'envoyee')}
                              title="Marquer comme envoyée"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(f.statut === 'envoyee' || f.statut === 'retard') && (
                            <button
                              onClick={() => marquerPayee(f)}
                              title="Marquer comme payée"
                              className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {f.statut === 'envoyee' && f.date_echeance && new Date(f.date_echeance) < new Date() && (
                            <button
                              onClick={() => changeStatut(f.id, 'retard')}
                              title="Marquer en retard"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(f)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(f.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <FormModal
          mode="facture"
          editId={editFacture?.id || null}
          chantiers={chantiers}
          initialForm={initialForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
      {deleteId && (
        <DeleteModal
          label="facture"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
export default function Devis() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'devis' | 'factures'>('devis');
  const [chantiers, setChantiers] = useState<Chantier[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('chantiers')
      .select('id, nom, ville')
      .eq('user_id', user.id)
      .order('nom')
      .then(({ data }) => setChantiers(data || []));
  }, [user]);

  if (!user) return null;

  return (
    <AppLayout title="Devis & Facturation" description="Gérez vos devis et factures pour vos chantiers BTP">
      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('devis')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'devis'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Devis
        </button>
        <button
          onClick={() => setActiveTab('factures')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'factures'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          Factures
        </button>
      </div>

      {/* Contenu onglets */}
      {activeTab === 'devis' ? (
        <OngletDevis userId={user.id} chantiers={chantiers} />
      ) : (
        <OngletFactures userId={user.id} chantiers={chantiers} />
      )}
    </AppLayout>
  );
}
