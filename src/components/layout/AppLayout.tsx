import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, HardHat, Users, Settings, LogOut,
  Menu, X, ChevronRight, BarChart3, Calendar, Clock,
  Camera, FileText, Bell, Smartphone, AlertTriangle,
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { ChatBot } from '../chat/ChatBot';
import { supabase } from '../../lib/supabase';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chantiers',       href: '/chantiers', icon: HardHat },
  { name: 'Equipes',         href: '/equipes',   icon: Users },
  { name: 'Pilotage',        href: '/pilotage',  icon: BarChart3 },
  { name: 'Planning',        href: '/planning',  icon: Calendar },
  { name: 'Pointage',        href: '/pointage',  icon: Clock },
  { name: 'Photos',          href: '/galerie',   icon: Camera },
  { name: 'Devis & Factures',href: '/devis',     icon: FileText },
  { name: 'Terrain',         href: '/terrain',   icon: Smartphone },
];

const secondaryNavigation = [
  { name: 'Alertes',    href: '/alertes',  icon: Bell },
  { name: 'Parametres', href: '/settings', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, description, actions }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nbAlertes, setNbAlertes] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false)
      .then(({ count }) => setNbAlertes(count ?? 0));
  }, [user, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  const NavLink = ({ item, badge, onClick }: { item: typeof navigation[0]; badge?: number; onClick?: () => void }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        {badge && badge > 0 ? (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? 'bg-white text-slate-900' : 'bg-red-500 text-white'}`}>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Batium" className="w-8 h-8 object-contain" />
          <span className="font-bold text-slate-900 tracking-wide">BATIUM</span>
        </div>
        <Link to="/alertes" className="relative p-2 rounded-lg hover:bg-slate-100">
          <Bell className="w-5 h-5 text-slate-600" />
          {nbAlertes > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {nbAlertes > 9 ? '9+' : nbAlertes}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Batium" className="w-8 h-8 object-contain" />
                <span className="font-bold text-slate-900 tracking-wide">BATIUM</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                <NavLink item={secondaryNavigation[0]} badge={nbAlertes} onClick={() => setSidebarOpen(false)} />
                <NavLink item={secondaryNavigation[1]} onClick={() => setSidebarOpen(false)} />
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-slate-200">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
          <img src={logo} alt="Batium" className="w-8 h-8 object-contain" />
          <span className="font-bold text-slate-900 tracking-wide">BATIUM</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          <NavLink item={secondaryNavigation[0]} badge={nbAlertes} />
          <NavLink item={secondaryNavigation[1]} />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Deconnexion
          </button>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="hidden lg:block bg-white border-b border-slate-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link to="/dashboard" className="hover:text-slate-700">Accueil</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-900 font-medium">{title}</span>
              </div>
              <div className="flex items-center gap-3">
                {actions}
                <Link
                  to="/alertes"
                  className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {nbAlertes > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {nbAlertes > 9 ? '9+' : nbAlertes}
                    </span>
                  )}
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {description && <p className="mt-1 text-slate-600">{description}</p>}
              </div>
              {nbAlertes > 0 && location.pathname !== '/alertes' && (
                <Link
                  to="/alertes"
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''} non lue{nbAlertes > 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && <p className="mt-1 text-slate-600">{description}</p>}
            {nbAlertes > 0 && location.pathname !== '/alertes' && (
              <Link
                to="/alertes"
                className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''} en attente
              </Link>
            )}
          </div>
          {children}
        </main>
      </div>
      <ChatBot />
    </div>
  );
}
