import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Users,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Euro,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const STATUT_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  planifie:  { label: 'Planifie',   color: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400' },
  en_cours:  { label: 'En cours',   color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  pause:     { label: 'En pause',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  termine:   { label: 'Termine',    color: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  annule:    { label: 'Annule',     color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
};

interface Chantier {
  id: string;
  nom: string;
  ville: string;
  statut: string;
  avancement: number;
  date_fin_prevue: string | null;
  budget_prevu: number;
  budget_consomme: number;
  chef_chantier_nom: string;
}

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
  corps_metier: string;
}

interface Alerte {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const todayDate = new Date();
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [calYear, setCalYear] = useState(todayDate.getFullYear());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: ch }, { data: em }] = await Promise.all([
        supabase.from('chantiers').select('id,nom,ville,statut,avancement,date_fin_prevue,budget_prevu,budget_consomme,chef_chantier_nom').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('employes').select('id,nom,prenom,statut,corps_metier').eq('user_id', user.id).limit(50),
      ]);
      const chantiersData = ch || [];
      const employesData = em || [];
      setChantiers(chantiersData);
      setEmployes(employesData);
      const newAlertes: Alerte[] = [];
      chantiersData.forEach((c) => {
        if (c.statut === 'en_cours' && c.date_fin_prevue) {
          const fin = new Date(c.date_fin_prevue);
          const diff = Math.ceil((fin.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) newAlertes.push({ id: `retard-${c.id}`, type: 'danger', message: `Chantier "${c.nom}" est en retard de ${Math.abs(diff)} jours` });
          else if (diff <= 7) newAlertes.push({ id: `urgence-${c.id}`, type: 'warning', message: `Chantier "${c.nom}" se termine dans ${diff} jour${diff > 1 ? 's' : ''}` });
        }
        if (c.budget_prevu > 0 && c.budget_consomme > c.budget_prevu * 0.9) {
          newAlertes.push({ id: `budget-${c.id}`, type: 'warning', message: `Budget presque epuise sur "${c.nom}" (${Math.round((c.budget_consomme / c.budget_prevu) * 100)}%)` });
        }
      });
      const dispo = employesData.filter(e => e.statut === 'disponible').length;
      if (dispo > 0) newAlertes.push({ id: 'dispo', type: 'info', message: `${dispo} employe${dispo > 1 ? 's' : ''} disponible${dispo > 1 ? 's' : ''} a affecter` });
      setAlertes(newAlertes.slice(0, 4));
      setLoading(false);
    };
    load();
  }, [user]);

  const chantiersEnCours = chantiers.filter(c => c.statut === 'en_cours');
  const chantiersTermines = chantiers.filter(c => c.statut === 'termine');
  const employesEnChantier = employes.filter(e => e.statut === 'en_chantier');
  const totalBudget = chantiers.reduce((s, c) => s + (c.budget_prevu || 0), 0);

  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isToday = (day: number) => day === todayDate.getDate() && calMonth === todayDate.getMonth() && calYear === todayDate.getFullYear();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const hour = new Date().getHours();
  const greeting = hour >= 18 ? 'Bonsoir' : hour < 6 ? 'Bonne nuit' : 'Bonjour';

  const formatEuro = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const quickStats = [
    { label: 'Chantiers en cours', value: loading ? '—' : String(chantiersEnCours.length), change: `${chantiers.length} au total`, icon: HardHat, color: 'bg-blue-50 text-blue-600' },
    { label: 'Equipe mobilisee', value: loading ? '—' : String(employesEnChantier.length), change: `${employes.length} employes`, icon: Users, color: 'bg-orange-50 text-orange-600' },
    { label: 'Chantiers termines', value: loading ? '—' : String(chantiersTermines.length), change: 'ce mois', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Budget total', value: loading ? '—' : formatEuro(totalBudget), change: 'portefeuille actif', icon: Euro, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <AppLayout title="Tableau de bord" description={`${greeting}, ${displayName}. Voici l'etat de votre entreprise.`}>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {alertes.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertes.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' : a.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendrier
              </CardTitle>
              <div className="flex items-center gap-1">
                <button onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-sm font-medium text-slate-700 min-w-[130px] text-center">{MONTHS_FR[calMonth]} {calYear}</span>
                <button onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-1">
              {DAYS_SHORT.map((d, i) => <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {cells.map((day, idx) => (
                <div key={idx} className={`flex flex-col items-center py-1.5 rounded-lg ${day ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''}`}>
                  {day && (
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full font-medium transition-colors ${isToday(day) ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>{day}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Echeances proches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
            ) : chantiersEnCours.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun chantier en cours</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chantiersEnCours.slice(0, 4).map(c => {
                  const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
                  const diff = fin ? Math.ceil((fin.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.nom}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.ville}</span>
                        {diff !== null && (
                          <span className={`text-xs font-medium ${diff < 0 ? 'text-red-600' : diff <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {diff < 0 ? `${Math.abs(diff)}j retard` : `J-${diff}`}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${c.avancement}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link to="/chantiers">
                <Button variant="ghost" size="sm" className="w-full">Voir tous les chantiers <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><HardHat className="w-5 h-5" />Chantiers actifs</CardTitle>
              <Link to="/chantiers"><Button variant="ghost" size="sm">Tout voir <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
            ) : chantiersEnCours.length === 0 ? (
              <div className="text-center py-10">
                <HardHat className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500 mb-4">Aucun chantier en cours pour le moment</p>
                <Link to="/chantiers"><Button size="sm">Creer un chantier</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {chantiersEnCours.slice(0, 5).map(c => {
                  const budgetPct = c.budget_prevu > 0 ? Math.round((c.budget_consomme / c.budget_prevu) * 100) : 0;
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                      <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.nom}</p>
                          <span className="text-xs text-slate-500 flex-shrink-0">{c.avancement}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.ville} {c.chef_chantier_nom && `· ${c.chef_chantier_nom}`}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.avancement}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-slate-700">{formatEuro(c.budget_consomme)}</p>
                        <p className="text-xs text-slate-400">/ {formatEuro(c.budget_prevu)}</p>
                        <p className={`text-xs font-medium mt-0.5 ${budgetPct > 90 ? 'text-red-600' : budgetPct > 70 ? 'text-amber-600' : 'text-green-600'}`}>{budgetPct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Equipe</CardTitle>
                <Link to="/equipes"><Button variant="ghost" size="sm">Gerer <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'En chantier', count: employes.filter(e => e.statut === 'en_chantier').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Disponibles', count: employes.filter(e => e.statut === 'disponible').length, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'En conge', count: employes.filter(e => e.statut === 'conge').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Arret', count: employes.filter(e => e.statut === 'arret').length, color: 'text-red-600', bg: 'bg-red-50' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-lg p-2.5 text-center`}>
                        <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                        <p className="text-xs text-slate-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {employes.length === 0 && (
                    <div className="text-center py-2">
                      <Link to="/equipes"><Button variant="outline" size="sm" className="w-full">Ajouter des employes</Button></Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Acces rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Chantiers', href: '/chantiers', icon: HardHat },
                  { label: 'Equipes', href: '/equipes', icon: Users },
                  { label: 'Pilotage', href: '/pilotage', icon: Activity },
                  { label: 'Planning', href: '/planning', icon: Calendar },
                ].map(item => (
                  <Link key={item.href} to={item.href} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <item.icon className="w-5 h-5 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700 text-center">{item.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
