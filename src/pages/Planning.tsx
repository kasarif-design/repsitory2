import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui';
import { HardHat, MapPin, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
        <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Aujourd'hui</button>
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
    </AppLayout>
  );
}
