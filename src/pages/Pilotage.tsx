import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import {
  HardHat, Users, Euro, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, BarChart3, PieChart, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalChantiers: number;
  chantiersEnCours: number;
  chantiersTermines: number;
  chantiersPlanifies: number;
  chantiersEnRetard: number;
  totalEmployes: number;
  employesMobilises: number;
  employesDisponibles: number;
  budgetTotal: number;
  budgetConsomme: number;
  budgetRestant: number;
  avancementMoyen: number;
  chantiersParStatut: { statut: string; count: number; label: string; color: string }[];
  emploiesParMetier: { metier: string; count: number; label: string }[];
  chantiersCritiques: { nom: string; ville: string; avancement: number; budgetPct: number; diff: number | null }[];
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  planifie:  { label: 'Planifie',  color: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400' },
  en_cours:  { label: 'En cours', color: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-500' },
  pause:     { label: 'En pause', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  termine:   { label: 'Termine',  color: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  annule:    { label: 'Annule',   color: 'bg-red-100 text-red-700',     bar: 'bg-red-400' },
};

const METIER_LABELS: Record<string, string> = {
  macon: 'Macon', charpentier: 'Charpentier', electricien: 'Electricien',
  plombier: 'Plombier', peintre: 'Peintre', carreleur: 'Carreleur',
  menuisier: 'Menuisier', conducteur_travaux: 'Cond. travaux', chef_chantier: 'Chef chantier',
  grutier: 'Grutier', coffreur: 'Coffreur', soudeur: 'Soudeur', autre: 'Autre',
};

const formatEuro = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function Pilotage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: chantiers }, { data: employes }] = await Promise.all([
        supabase.from('chantiers').select('*').eq('user_id', user.id),
        supabase.from('employes').select('*').eq('user_id', user.id),
      ]);
      const ch = chantiers || [];
      const em = employes || [];
      const today = new Date();

      const enCours = ch.filter(c => c.statut === 'en_cours');
      const retard = enCours.filter(c => {
        if (!c.date_fin_prevue) return false;
        return new Date(c.date_fin_prevue) < today;
      });

      const budgetTotal = ch.reduce((s, c) => s + (c.budget_prevu || 0), 0);
      const budgetConsomme = ch.reduce((s, c) => s + (c.budget_consomme || 0), 0);
      const avancementMoyen = ch.length > 0 ? Math.round(ch.reduce((s, c) => s + (c.avancement || 0), 0) / ch.length) : 0;

      const chantiersParStatut = Object.entries(STATUT_CONFIG).map(([statut, cfg]) => ({
        statut, count: ch.filter(c => c.statut === statut).length,
        label: cfg.label, color: cfg.bar,
      })).filter(s => s.count > 0);

      const metierCounts: Record<string, number> = {};
      em.forEach(e => { metierCounts[e.corps_metier] = (metierCounts[e.corps_metier] || 0) + 1; });
      const emploiesParMetier = Object.entries(metierCounts).map(([metier, count]) => ({
        metier, count, label: METIER_LABELS[metier] || metier
      })).sort((a, b) => b.count - a.count);

      const chantiersCritiques = ch
        .filter(c => c.statut === 'en_cours')
        .map(c => {
          const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
          const diff = fin ? Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
          const budgetPct = c.budget_prevu > 0 ? Math.round((c.budget_consomme / c.budget_prevu) * 100) : 0;
          return { nom: c.nom, ville: c.ville, avancement: c.avancement, budgetPct, diff };
        })
        .filter(c => (c.diff !== null && c.diff <= 14) || c.budgetPct >= 80)
        .sort((a, b) => (a.diff ?? 999) - (b.diff ?? 999))
        .slice(0, 5);

      setStats({
        totalChantiers: ch.length,
        chantiersEnCours: enCours.length,
        chantiersTermines: ch.filter(c => c.statut === 'termine').length,
        chantiersPlanifies: ch.filter(c => c.statut === 'planifie').length,
        chantiersEnRetard: retard.length,
        totalEmployes: em.length,
        employesMobilises: em.filter(e => e.statut === 'en_chantier').length,
        employesDisponibles: em.filter(e => e.statut === 'disponible').length,
        budgetTotal, budgetConsomme, budgetRestant: budgetTotal - budgetConsomme,
        avancementMoyen, chantiersParStatut, emploiesParMetier, chantiersCritiques,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <AppLayout title="Pilotage" description="Vue d'ensemble de votre activite BTP">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const budgetPctGlobal = stats.budgetTotal > 0 ? Math.round((stats.budgetConsomme / stats.budgetTotal) * 100) : 0;
  const tauxMobilisation = stats.totalEmployes > 0 ? Math.round((stats.employesMobilises / stats.totalEmployes) * 100) : 0;
  const maxStatut = stats.chantiersParStatut.length > 0 ? Math.max(...stats.chantiersParStatut.map(s => s.count)) : 1;
  const maxMetier = stats.emploiesParMetier.length > 0 ? Math.max(...stats.emploiesParMetier.map(m => m.count)) : 1;

  return (
    <AppLayout title="Pilotage" description="Vue d'ensemble et indicateurs cles de votre activite">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          {
            label: 'Chantiers actifs', value: stats.chantiersEnCours, sub: `${stats.totalChantiers} au total`,
            icon: HardHat, color: 'bg-blue-50 text-blue-600',
            alert: stats.chantiersEnRetard > 0 ? `${stats.chantiersEnRetard} en retard` : null, alertColor: 'text-red-600',
          },
          {
            label: 'Equipe mobilisee', value: `${stats.employesMobilises}/${stats.totalEmployes}`, sub: `${stats.employesDisponibles} disponible${stats.employesDisponibles > 1 ? 's' : ''}`,
            icon: Users, color: 'bg-orange-50 text-orange-600', alert: `${tauxMobilisation}% utilisation`, alertColor: tauxMobilisation > 80 ? 'text-green-600' : 'text-slate-400',
          },
          {
            label: 'Avancement moyen', value: `${stats.avancementMoyen}%`, sub: 'tous chantiers',
            icon: Target, color: 'bg-green-50 text-green-600', alert: `${stats.chantiersTermines} termines`, alertColor: 'text-green-600',
          },
          {
            label: 'Budget consomme', value: `${budgetPctGlobal}%`, sub: formatEuro(stats.budgetConsomme),
            icon: Euro, color: 'bg-slate-100 text-slate-600',
            alert: `/ ${formatEuro(stats.budgetTotal)}`, alertColor: budgetPctGlobal > 90 ? 'text-red-600' : 'text-slate-400',
          },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-400">{s.sub}</p>
                {s.alert && <p className={`text-xs font-medium ${s.alertColor}`}>{s.alert}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Euro className="w-5 h-5" />Budget global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Prevu', value: formatEuro(stats.budgetTotal), color: 'text-slate-700' },
                { label: 'Consomme', value: formatEuro(stats.budgetConsomme), color: budgetPctGlobal > 90 ? 'text-red-600' : 'text-blue-600' },
                { label: 'Restant', value: formatEuro(stats.budgetRestant), color: stats.budgetRestant < 0 ? 'text-red-600' : 'text-green-600' },
              ].map(b => (
                <div key={b.label} className="text-center p-3 rounded-xl bg-slate-50">
                  <p className={`text-xl font-bold ${b.color}`}>{b.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{b.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Utilisation budget</span>
                <span className={`font-semibold ${budgetPctGlobal > 90 ? 'text-red-600' : budgetPctGlobal > 70 ? 'text-amber-600' : 'text-green-600'}`}>{budgetPctGlobal}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${budgetPctGlobal > 90 ? 'bg-red-500' : budgetPctGlobal > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(budgetPctGlobal, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0%</span>
                <span className="text-amber-500">70% — Vigilance</span>
                <span className="text-red-500">90% — Critique</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Chantiers par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chantiersParStatut.length === 0 ? (
              <div className="text-center py-8 text-slate-400"><HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Aucune donnee</p></div>
            ) : (
              <div className="space-y-3">
                {stats.chantiersParStatut.map(s => (
                  <div key={s.statut}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-semibold text-slate-900">{s.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.count / maxStatut) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Chantiers a surveiller</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chantiersCritiques.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="text-sm text-slate-500">Tous vos chantiers sont dans les clous !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.chantiersCritiques.map((c, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${c.diff !== null && c.diff < 0 ? 'border-red-200 bg-red-50' : c.budgetPct >= 90 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.nom}</p>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {c.diff !== null && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.diff < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.diff < 0 ? `${Math.abs(c.diff)}j retard` : `J-${c.diff}`}
                          </span>
                        )}
                        {c.budgetPct >= 80 && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.budgetPct >= 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>Budget {c.budgetPct}%</span>}
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `${c.avancement}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{c.ville} · {c.avancement}% avancement</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Repartition de l'equipe</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.emploiesParMetier.length === 0 ? (
              <div className="text-center py-8 text-slate-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Aucun employe enregistre</p></div>
            ) : (
              <div className="space-y-3">
                {stats.emploiesParMetier.map(m => (
                  <div key={m.metier}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{m.label}</span>
                      <span className="font-semibold text-slate-900">{m.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(m.count / maxMetier) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
