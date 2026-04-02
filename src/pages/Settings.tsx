import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Alert } from '../components/ui';
import {
  User,
  Shield,
  Save,
  CreditCard,
  AlertTriangle,
  LogOut,
  Trash2,
  Bell,
  CheckCircle,
  X,
  Check,
  Sparkles
} from 'lucide-react';

const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Pour les petites equipes qui debutent',
    features: [
      '5 membres max',
      '10 projets',
      '5 Go de stockage',
      'Support par email',
      'Rapports basiques',
    ],
    popular: false,
  },
  {
    name: 'Business',
    price: 79,
    description: 'Pour les equipes en croissance',
    features: [
      '25 membres max',
      'Projets illimites',
      '50 Go de stockage',
      'Support prioritaire',
      'Rapports avances',
      'Integrations API',
      'SSO',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'Pour les grandes organisations',
    features: [
      'Membres illimites',
      'Projets illimites',
      'Stockage illimite',
      'Support dedie 24/7',
      'Rapports personnalises',
      'API complete',
      'SSO + SAML',
      'SLA garanti',
      'Formation incluse',
    ],
    popular: false,
  },
];

export function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    const { error } = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') return;
    setShowDeleteModal(false);
  };

  const handleSelectPlan = async (planName: string) => {
    const plan = planName.toLowerCase() as 'starter' | 'business' | 'enterprise';
    setCheckoutLoading(plan);
    setCheckoutError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripeCheckout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Impossible de creer la session de paiement.');
      }

      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <AppLayout
      title="Parametres"
      description="Gerez votre compte et vos preferences."
    >
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations du profil
            </CardTitle>
            <CardDescription>
              Mettez a jour vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-6">
                Profil mis a jour avec succes !
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Avatar'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    label="URL de l'avatar"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://exemple.com/avatar.jpg"
                    hint="Entrez l'URL d'une image pour votre avatar"
                  />
                </div>
              </div>

              <Input
                label="Nom complet"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
              />

              <Input
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
                hint="L'email ne peut pas etre modifie"
              />

              <div className="flex justify-end">
                <Button type="submit" loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configurez vos preferences de notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Notifications par email', description: 'Recevoir des mises a jour par email', defaultChecked: true },
                { label: 'Alertes de securite', description: 'Etre notifie des connexions suspectes', defaultChecked: true },
                { label: 'Newsletter', description: 'Recevoir notre newsletter mensuelle', defaultChecked: false },
                { label: 'Mises a jour produit', description: 'Etre informe des nouvelles fonctionnalites', defaultChecked: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.defaultChecked}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Securite
            </CardTitle>
            <CardDescription>
              Informations sur la securite de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <dt className="text-slate-600">Methode de connexion</dt>
                <dd className="font-medium text-slate-900">
                  {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email / Mot de passe'}
                </dd>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <dt className="text-slate-600">Derniere connexion</dt>
                <dd className="font-medium text-slate-900">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-600">ID du compte</dt>
                <dd className="font-mono text-sm text-slate-500 truncate max-w-[250px]">
                  {user?.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gerez votre abonnement et votre facturation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-50 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">Plan Business</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Actif
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Votre abonnement se renouvelle le 16 mars 2026
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">79</span>
                <span className="text-slate-600">/mois</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" fullWidth onClick={() => setShowPricingModal(true)}>
                Modifier le plan
              </Button>
              <Button variant="outline" fullWidth>
                Gerer les moyens de paiement
              </Button>
              <Button variant="outline" fullWidth>
                Telecharger les factures
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowCancelModal(true)}
              >
                Resilier l'abonnement
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Session
            </CardTitle>
            <CardDescription>
              Gerez votre session active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Deconnectez-vous de votre compte sur cet appareil.
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se deconnecter
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Zone de danger
            </CardTitle>
            <CardDescription className="text-red-600">
              Actions irreversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">Supprimer mon compte</h4>
                  <p className="text-sm text-slate-600 mt-1 mb-4">
                    Cette action est irreversible. Toutes vos donnees seront definitivement supprimees.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Supprimer mon compte
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Resilier votre abonnement ?
              </h3>
              <p className="text-slate-600 mt-2">
                Vous perdrez l'acces aux fonctionnalites premium a la fin de votre periode de facturation actuelle.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowCancelModal(false)}
              >
                Confirmer la resiliation
              </Button>
              <Button fullWidth onClick={() => setShowCancelModal(false)}>
                Garder mon abonnement
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Supprimer votre compte ?
              </h3>
              <p className="text-slate-600 mt-2">
                Cette action est irreversible. Toutes vos donnees, projets et historique seront definitivement supprimes.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="SUPPRIMER"
              />
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={deleteConfirmation !== 'SUPPRIMER'}
                onClick={handleDeleteAccount}
              >
                Supprimer definitivement
              </Button>
              <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setShowPricingModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">
                Choisissez votre plan
              </h3>
              <p className="text-slate-600 mt-2">
                Selectionnez le plan qui correspond le mieux a vos besoins
              </p>
            </div>

            {checkoutError && (
              <Alert variant="error" className="mb-6">
                {checkoutError}
              </Alert>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${
                    plan.popular
                      ? 'border-slate-900 shadow-lg scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
                        <Sparkles className="w-3 h-3" />
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600">/mois</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    fullWidth
                    disabled={checkoutLoading !== null}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {checkoutLoading === plan.name.toLowerCase()
                      ? 'Redirection...'
                      : 'Choisir ce plan'}
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Tous les prix sont en euros HT. Annulation possible a tout moment.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
