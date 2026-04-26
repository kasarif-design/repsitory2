import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle2,
  Trash2, RefreshCw, Loader2, X, Zap, BellOff,
  TrendingDown, Clock, DollarSign, HardHat,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  titre: string;
  message: string;
  lu: boolean;
  priorite: 'faible' | 'normale' | 'haute' | 'critique';
  lien_cible: string;
  created_at: string;
}

const TYPE_CONFIG = {
  error:   { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    label: 'Critique' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Attention' },
  info:    { icon: Info,          bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400',  label: 'Info' },
  success: { icon: CheckCircle2,  bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'OK' },
};

const PRIORITE_ORDER = { critique: 0, haute: 1, normale: 2, faible: 3 };

const formatRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'A l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const j = Math.floor(h / 24);
  return `Il y a ${j} jour${j > 1 ? 's' : ''}`;
};

const getAlertIcon = (titre: string) => {
  if (titre.toLowerCase().includes('retard')) return Clock;
  if (titre.toLowerCase().includes('budget')) return DollarSign;
  if (titre.toLowerCase().includes('bloquée') || titre.toLowerCase().includes('bloquee')) return AlertTriangle;
  if (titre.toLowerCase().includes('avancement')) return TrendingDown;
  return HardHat;
};

export default function Alertes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ created: number } | null>(null);
  const [filter, setFilter] = useState<'toutes' | 'non_lues' | 'error' | 'warning'>('toutes');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const lancer = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-alertes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const json = await res.json();
      setScanResult({ created: json.created ?? 0 });
      await load();
    } catch {
      setScanResult({ created: -1 });
    } finally {
      setScanning(false);
    }
  };

  const marquerLu = async (id: string) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const toutMarquerLu = async () => {
    const ids = notifications.filter(n => !n.lu).map(n => n.id);
    if (!ids.length) return;
    await supabase.from('notifications').update({ lu: true }).in('id', ids);
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const supprimer = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const supprimerToutes = async () => {
    if (!user) return;
    const lues = notifications.filter(n => n.lu).map(n => n.id);
    if (!lues.length) return;
    await supabase.from('notifications').delete().in('id', lues);
    setNotifications(prev => prev.filter(n => !n.lu));
  };

  const filtered = notifications
    .filter(n => {
      if (filter === 'non_lues') return !n.lu;
      if (filter === 'error') return n.type === 'error';
      if (filter === 'warning') return n.type === 'warning';
      return true;
    })
    .sort((a, b) => {
      if (a.lu !== b.lu) return a.lu ? 1 : -1;
      const pa = PRIORITE_ORDER[a.priorite] ?? 3;
      const pb = PRIORITE_ORDER[b.priorite] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const nbNonLues = notifications.filter(n => !n.lu).length;
  const nbCritiques = notifications.filter(n => n.type === 'error' && !n.lu).length;
  const nbWarnings = notifications.filter(n => n.type === 'warning' && !n.lu).length;

  return (
    <AppLayout title="Alertes" description="Surveillance intelligente de vos chantiers">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'toutes',    label: `Toutes (${notifications.length})` },
            { key: 'non_lues',  label: `Non lues (${nbNonLues})` },
            { key: 'error',     label: `Critiques (${notifications.filter(n => n.type === 'error').length})` },
            { key: 'warning',   label: `Avertissements (${notifications.filter(n => n.type === 'warning').length})` },
          ] as { key: typeof filter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {nbNonLues > 0 && (
            <button onClick={toutMarquerLu} className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Tout marquer lu
            </button>
          )}
          <button
            onClick={lancer}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Analyse...' : 'Lancer le scan'}
          </button>
        </div>
      </div>

      {scanResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${scanResult.created === -1 ? 'bg-red-50 border-red-200' : scanResult.created === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          {scanResult.created === -1
            ? <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            : scanResult.created === 0
            ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          }
          <div>
            <p className="font-medium text-sm text-slate-900">
              {scanResult.created === -1
                ? 'Erreur lors du scan'
                : scanResult.created === 0
                ? 'Aucun nouveau probleme detecte'
                : `${scanResult.created} nouvelle${scanResult.created > 1 ? 's' : ''} alerte${scanResult.created > 1 ? 's' : ''} detectee${scanResult.created > 1 ? 's' : ''}`
              }
            </p>
            {scanResult.created > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">Verifiez les alertes ci-dessous et prenez les mesures necessaires</p>
            )}
          </div>
          <button onClick={() => setScanResult(null)} className="ml-auto p-1 rounded hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Stats rapides */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Non lues', value: nbNonLues, icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Critiques', value: nbCritiques, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Avertissements', value: nbWarnings, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total alertes', value: notifications.length, icon: RefreshCw, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map(s => (
            <Card key={s.label} padding="none">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg} flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center">
            <BellOff className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium mb-2">
              {filter === 'toutes' ? 'Aucune alerte pour le moment' : 'Aucune alerte dans cette categorie'}
            </p>
            <p className="text-sm text-slate-400 mb-6 text-center max-w-xs">
              {filter === 'toutes' && 'Lancez un scan pour detecter les retards, depassements de budget et taches bloquees'}
            </p>
            {filter === 'toutes' && (
              <Button onClick={lancer} disabled={scanning}>
                <Zap className="w-4 h-4 mr-2" />
                Lancer le premier scan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.filter(n => n.lu).length > 0 && (
            <div className="flex justify-end mb-1">
              <button onClick={supprimerToutes} className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" />Supprimer les alertes lues
              </button>
            </div>
          )}
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = getAlertIcon(n.titre);
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-4 rounded-xl border transition-all ${n.lu ? 'bg-white border-slate-100 opacity-70' : `${cfg.bg} ${cfg.border}`}`}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${n.lu ? 'bg-slate-100' : cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${n.lu ? 'text-slate-400' : n.type === 'error' ? 'text-red-500' : n.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${n.lu ? 'text-slate-500' : 'text-slate-900'}`}>{n.titre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                      {n.priorite === 'critique' && !n.lu && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-600 text-white animate-pulse">URGENT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.lu && (
                        <button onClick={() => marquerLu(n.id)} className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors" title="Marquer comme lu">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => supprimer(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${n.lu ? 'text-slate-400' : 'text-slate-700'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelative(n.created_at)}
                    {!n.lu && <span className={`inline-block w-2 h-2 rounded-full ml-2 ${cfg.dot}`} />}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
