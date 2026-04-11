import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useState, useRef, useEffect } from 'react';
import logo from '../../assets/logo.png';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="bg-night-50 border-b border-night-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-electric rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-light-300">Dashboard</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-night-100 transition-colors"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-night-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-light-400">{initials}</span>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-light-400">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-night-50 rounded-lg shadow-lg border border-night-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-night-100">
                  <p className="text-sm font-medium text-light-300">{displayName}</p>
                  <p className="text-sm text-light-500 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-light-400 hover:bg-night-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Tableau de bord
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-light-400 hover:bg-night-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Parametres
                </Link>

                <div className="border-t border-night-100 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Deconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function PublicHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-14 h-14" />
            <span className="font-bold text-xl text-white">BATIUM</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-light-300 hover:text-white hover:bg-white/10">
                Connexion
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
