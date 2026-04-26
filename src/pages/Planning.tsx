import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import {
  HardHat, MapPin, ChevronLeft, ChevronRight, Calendar,
  Brain, X, Loader2, AlertCircle, Users, AlertTriangle,
  Lightbulb, Zap, CloudRain, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlanningJourAffectation {
  chantier: string;
  ville: string;
  equipe: string[];
  taches_du_jour: string[];
  notes: string;
}

interface PlanningJour {
  jour: string;
  date: string;
  affectations: PlanningJourAffectation[];
  alertes_jour: string[];
}

interface PlanningIA {
  semaine: string;
  resume: string;
  jours: PlanningJour[];
  employes_non_affectes: string[];
  chantiers_sans_equipe: string[];
  conseils_optimisation: string[];
  risques_semaine: string[];
}

const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const DAYS_FULL = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const STATUT_COLORS: Record<string, string> = {
  planifie: 'bg-slate-200 text-slate-700 border-slate-300',
  en_cours: 'bg-blue-200 text-blue-800 border-blue-300',
  pause: 'bg-amber-200 text-amber-800 border-amber-300',
  termine: 'bg-green-200 text-green-800 border-green-300',
  annule: 'bg-red-100 text-red-700 border-red-200',
};

interface Chantier {
  id: string;
  nom: string;
  ville: string;
  statut: string;
  date_debut: string | null;
  date_fin_prevue: string | null;
  avancement: number;
  chef_chantier_nom: string;
}

export default function Planning() {
  const { user } = useAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showPlanningIA, setShowPlanningIA] = useState(false);
  const [planningIA, setPlanningIA] = useState<PlanningIA | null>(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningError, setPlanningError] = useState('');
  const [meteoInput, setMeteoInput] = useState('');
  const [activeJour, setActiveJour] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('chantiers').select('id,nom,ville,statut,date_debut,date_fin_prevue,avancement,chef_chantier_nom')
      .eq('user_id', user.id).not('date_debut', 'is', null)
      .order('date_debut').then(({ data }) => { setChantiers(data || []); setLoading(false); });
  }, [user]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const getChantiersForDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    return chantiers.filter(c => {
      const start = c.date_debut ? new Date(c.date_debut) : null;
      const end = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
      if (!start) return false;
      const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endNorm = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startNorm;
      return date >= startNorm && date <= endNorm;
    });
  };

  const chantiersThisMonth = chantiers.filter(c => {
    const start = c.date_debut ? new Date(c.date_debut) : null;
    const end = c.date_fin_prevue ? new Date(c.date_fin_prevue) : null;
    if (!start) return false;
    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 0);
    const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endNorm = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startNorm;
    return startNorm <= monthEnd && endNorm >= monthStart;
  });

  const isToday = (day: number) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const lancerPlanningIA = async () => {
    setPlanningIA(null);
    setPlanningError('');
    setPlanningLoading(true);
    setActiveJour(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/planning-ia`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meteo: meteoInput || undefined }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Erreur inconnue');
      setPlanningIA(json.planning);
      if (json.planning?.jours?.length) setActiveJour(json.planning.jours[0].jour);
    } catch (e) {
      setPlanningError(e instanceof Error ? e.message : 'Erreur lors de la generation');
    } finally {
      setPlanningLoading(false);
    }
  };

  const prev = () => { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); };
  const next = () => { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); };
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <AppLayout title="Planning" description="Vue calendrier de vos chantiers">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
          <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">{MONTHS_FR[viewMonth]} {viewYear}</h2>
          <button onClick={next} className="p-2 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Aujourd'hui</button>
          <button
            onClick={() => setShowPlanningIA(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <Brain className="w-4 h-4" />
            Planning IA
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {DAYS_FULL.map((d, i) => (
                  <div key={i} className={`text-center text-xs font-semibold py-2 ${i >= 5 ? 'text-slate-400' : 'text-slate-600'}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} className="min-h-[90px]" />;
                  const dayChantiers = getChantiersForDay(day);
                  const isWeekend = (idx % 7) >= 5;
                  return (
                    <div key={idx} className={`min-h-[90px] p-1.5 rounded-lg border transition-colors ${isToday(day) ? 'border-slate-900 bg-slate-50' : isWeekend ? 'border-transparent bg-slate-50/50' : 'border-transparent hover:bg-slate-50'}`}>
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full font-medium mb-1 ${isToday(day) ? 'bg-slate-900 text-white' : isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>{day}</span>
                      <div className="space-y-0.5">
                        {dayChantiers.slice(0, 2).map(c => (
                          <div key={c.id} className={`text-xs px-1.5 py-0.5 rounded border truncate ${STATUT_COLORS[c.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`} title={c.nom}>
                            {c.nom}
                          </div>
                        ))}
                        {dayChantiers.length > 2 && <div className="text-xs text-slate-500 pl-1">+{dayChantiers.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />Ce mois ({chantiersThisMonth.length})</h3>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />)}</div>
              ) : chantiersThisMonth.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun chantier ce mois</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chantiersThisMonth.map(c => {
                    const statusCfg = STATUT_COLORS[c.statut] || 'bg-slate-100 text-slate-700 border-slate-200';
                    return (
                      <div key={c.id} className={`p-3 rounded-xl border ${statusCfg} transition-all`}>
                        <p className="font-medium text-sm truncate">{c.nom}</p>
                        <p className="text-xs opacity-75 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.ville || '—'}</p>
                        <div className="flex items-center justify-between mt-1.5 text-xs opacity-70">
                          <span>{formatDate(c.date_debut)}</span>
                          <span>→ {formatDate(c.date_fin_prevue)}</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full bg-current rounded-full" style={{ width: `${c.avancement}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Legende</h3>
              <div className="space-y-2">
                {[
                  { label: 'Planifie', color: 'bg-slate-200 border-slate-300' },
                  { label: 'En cours', color: 'bg-blue-200 border-blue-300' },
                  { label: 'En pause', color: 'bg-amber-200 border-amber-300' },
                  { label: 'Termine', color: 'bg-green-200 border-green-300' },
                  { label: 'Annule', color: 'bg-red-100 border-red-200' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded border ${l.color}`} />
                    <span className="text-sm text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {showPlanningIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Planning IA de la semaine</h2>
                  <p className="text-xs text-slate-500">Affectation automatique des equipes par chantier</p>
                </div>
              </div>
              <button onClick={() => setShowPlanningIA(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {!planningIA && !planningLoading && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      Conditions meteo prevues cette semaine (optionnel)
                    </p>
                    <input
                      value={meteoInput}
                      onChange={e => setMeteoInput(e.target.value)}
                      placeholder="Ex: Pluie lundi et mardi, beau temps jeudi-vendredi..."
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                    />
                    <p className="text-xs text-slate-400 mt-2">L'IA adaptera les affectations en fonction de la meteo</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { icon: MapPin, text: 'Regroupement par zone geographique' },
                      { icon: Users, text: 'Affectation selon les corps de metier' },
                      { icon: Zap, text: 'Priorite aux chantiers urgents' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-emerald-800 text-xs">{text}</span>
                      </div>
                    ))}
                  </div>

                  {planningError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{planningError}</p>
                    </div>
                  )}

                  <Button onClick={lancerPlanningIA} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Generer le planning intelligent
                  </Button>
                </div>
              )}

              {planningLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-slate-600 font-medium">Generation du planning en cours...</p>
                  <p className="text-sm text-slate-400">L'IA optimise les affectations selon vos chantiers, equipes et meteo</p>
                </div>
              )}

              {planningIA && !planningLoading && (
                <div className="space-y-5">
                  {/* Resume */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">{planningIA.semaine}</p>
                    <p className="text-sm text-emerald-900 leading-relaxed">{planningIA.resume}</p>
                  </div>

                  {/* Navigation jours */}
                  <div>
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                      {planningIA.jours.map(j => (
                        <button
                          key={j.jour}
                          onClick={() => setActiveJour(j.jour)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activeJour === j.jour
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {j.jour.split(' ')[0]}
                          {j.alertes_jour?.length > 0 && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                        </button>
                      ))}
                    </div>

                    {planningIA.jours.filter(j => j.jour === activeJour).map(jour => (
                      <div key={jour.jour} className="space-y-3">
                        <h3 className="font-semibold text-slate-900 text-base">{jour.jour}</h3>

                        {jour.alertes_jour?.length > 0 && (
                          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              {jour.alertes_jour.map((a, i) => <p key={i} className="text-xs text-amber-800">{a}</p>)}
                            </div>
                          </div>
                        )}

                        {jour.affectations?.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-6">Aucune affectation ce jour</p>
                        )}

                        {jour.affectations?.map((aff, i) => (
                          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-semibold text-slate-900">{aff.chantier}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />{aff.ville}
                                </p>
                              </div>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg flex-shrink-0">
                                {aff.equipe?.length || 0} pers.
                              </span>
                            </div>

                            {aff.equipe?.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" />Equipe</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {aff.equipe.map((e, j) => (
                                    <span key={j} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{e}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {aff.taches_du_jour?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Taches du jour</p>
                                <ul className="space-y-1">
                                  {aff.taches_du_jour.map((t, j) => (
                                    <li key={j} className="text-xs text-slate-700 flex gap-2"><span className="text-slate-400 flex-shrink-0">•</span>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aff.notes && (
                              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mt-2">{aff.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Risques et conseils */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {planningIA.risques_semaine?.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4" />Risques de la semaine</h4>
                        <ul className="space-y-1">
                          {planningIA.risques_semaine.map((r, i) => <li key={i} className="text-xs text-red-800 flex gap-2"><span>•</span>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {planningIA.conseils_optimisation?.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm"><Lightbulb className="w-4 h-4" />Conseils d'optimisation</h4>
                        <ul className="space-y-1">
                          {planningIA.conseils_optimisation.map((c, i) => <li key={i} className="text-xs text-blue-800 flex gap-2"><span>•</span>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(planningIA.employes_non_affectes?.length > 0 || planningIA.chantiers_sans_equipe?.length > 0) && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                      {planningIA.employes_non_affectes?.length > 0 && (
                        <p className="text-amber-800 mb-1"><strong>Employes sans affectation :</strong> {planningIA.employes_non_affectes.join(', ')}</p>
                      )}
                      {planningIA.chantiers_sans_equipe?.length > 0 && (
                        <p className="text-amber-800"><strong>Chantiers sans equipe :</strong> {planningIA.chantiers_sans_equipe.join(', ')}</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => { setPlanningIA(null); setPlanningError(''); }}
                      className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1.5"
                    >
                      <Brain className="w-4 h-4" />Regenerer le planning
                    </button>
                    <Button variant="outline" onClick={() => setShowPlanningIA(false)}>Fermer</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
