import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { ChatBot } from '../chat/ChatBot';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytiques', href: '/analytics', icon: BarChart3 },
  { name: 'Projets', href: '/projects', icon: FolderKanban },
  { name: 'Equipe', href: '/team', icon: Users },
];

const secondaryNavigation = [
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  const NavLink = ({ item, onClick }: { item: typeof navigation[0]; onClick?: () => void }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <item.icon className="w-5 h-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">AppName</span>
        </div>
        <div className="w-10" />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-slate-900">AppName</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                {secondaryNavigation.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-slate-200">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">AppName</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          {secondaryNavigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
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
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
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
                <Link to="/dashboard" className="hover:text-slate-700">
                  Accueil
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-900 font-medium">{title}</span>
              </div>
              {actions}
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {description && (
                <p className="mt-1 text-slate-600">{description}</p>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && (
              <p className="mt-1 text-slate-600">{description}</p>
            )}
          </div>
          {children}
        </main>
      </div>
      <ChatBot />
    </div>
  );
}
