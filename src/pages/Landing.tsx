import { Link } from 'react-router-dom';
import {
  HardHat, Users, BarChart3, Calendar, CheckCircle2, ArrowRight,
  Star, Zap, MessageSquare, ChevronDown, AlertTriangle
} from 'lucide-react';
import logo from '../assets/logo.png';
import buildingBg from '../assets/building-bg.jpg';

const features = [
  {
    icon: HardHat,
    title: 'Gestion des chantiers',
    desc: 'Suivez l\'avancement, les budgets, les delais et les intervenants de chaque chantier en temps reel.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Pilotage des equipes',
    desc: 'Affectez vos macons, electriciens, plombiers et chefs de chantier selon les besoins du terrain.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Calendar,
    title: 'Planning visuel',
    desc: 'Visualisez tous vos chantiers sur un calendrier interactif. Anticipez les conflits de planning.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Tableau de pilotage',
    desc: 'KPIs en temps reel : taux d\'avancement, budget consomme, retards, ressources mobilisees.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: AlertTriangle,
    title: 'Alertes intelligentes',
    desc: 'Soyez averti automatiquement des chantiers en retard, des budgets critiques et des ressources disponibles.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: MessageSquare,
    title: 'Assistant IA integre',
    desc: 'Posez vos questions en langage naturel. L\'IA analyse vos donnees et vous aide a prendre les bonnes decisions.',
    color: 'bg-slate-100 text-slate-600',
  },
];

const stats = [
  { value: '+500', label: 'PME du BTP', sub: 'nous font confiance' },
  { value: '94%', label: 'Satisfaction client', sub: 'score moyen' },
  { value: '-30%', label: 'Temps administratif', sub: 'gagne en moyenne' },
  { value: '+18%', label: 'Rentabilite', sub: 'amelioree en 6 mois' },
];

const testimonials = [
  {
    name: 'Laurent Mercier',
    role: 'Directeur, Mercier BTP',
    content: 'Depuis que nous utilisons Batium, nous avons enfin une vision claire de nos chantiers. Le suivi budgetaire en temps reel nous a evite plusieurs depassements couteux.',
    rating: 5,
  },
  {
    name: 'Sophie Renard',
    role: 'Conductrice de travaux, Renard Construction',
    content: 'L\'assistant IA est bluffant. Je lui demande "quels chantiers sont en retard cette semaine ?" et il me donne une reponse precise en 2 secondes.',
    rating: 5,
  },
  {
    name: 'Marc Fontaine',
    role: 'Gerant, Fontaine & Fils',
    content: 'La gestion des equipes est enfin simple. Je sais a tout moment qui est disponible, qui est sur quel chantier et quel est le taux horaire engage.',
    rating: 5,
  },
];

const pricing = [
  {
    name: 'Starter',
    price: '49',
    desc: 'Pour les artisans et petites structures',
    features: ['5 chantiers actifs', '10 employes', 'Tableau de bord', 'Planning mensuel', 'Support email'],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    name: 'Pro',
    price: '99',
    desc: 'Pour les PME en pleine croissance',
    features: ['Chantiers illimites', '50 employes', 'Pilotage avance', 'Alertes automatiques', 'Assistant IA', 'Export PDF/Excel', 'Support prioritaire'],
    cta: 'Essai gratuit 14 jours',
    popular: true,
  },
  {
    name: 'Entreprise',
    price: 'Sur devis',
    desc: 'Pour les groupes et grandes PME',
    features: ['Utilisateurs illimites', 'Multi-agences', 'API & integrations', 'SSO entreprise', 'Onboarding dedie', 'SLA garanti'],
    cta: 'Nous contacter',
    popular: false,
  },
];

const faqs = [
  { q: 'Faut-il installer un logiciel ?', a: 'Non. Batium est 100% web. Vous y accedez depuis n\'importe quel navigateur, sur ordinateur, tablette ou telephone.' },
  { q: 'Est-ce que mes donnees sont securisees ?', a: 'Oui. Vos donnees sont hebergees en Europe, chiffrees et isolees par entreprise. Aucune donnee n\'est partagee entre clients.' },
  { q: 'Puis-je importer mes chantiers existants ?', a: 'Absolument. Nous vous accompagnons dans la migration de vos donnees existantes (Excel, anciens logiciels).' },
  { q: 'L\'IA a-t-elle acces a mes donnees ?', a: 'L\'IA n\'a acces qu\'aux donnees de votre propre entreprise. Elle les utilise uniquement pour vous repondre, jamais pour les partager.' },
  { q: 'Puis-je essayer avant d\'acheter ?', a: 'Oui, 14 jours d\'essai gratuit sans carte bancaire sur tous les plans.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-slate-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-900">{q}</span>
        <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      <p className="px-5 pb-5 text-slate-600 text-sm leading-relaxed">{a}</p>
    </details>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Batium" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-slate-900 tracking-wide">BATIUM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalites</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Connexion</Link>
            <Link to="/signup" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">Essai gratuit</Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden" style={{ backgroundImage: `url(${buildingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-white/80" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Logiciel de gestion BTP avec IA integree
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Pilotez votre entreprise
            <br />
            <span className="text-blue-600">BTP sans prise de tete</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Chantiers, equipes, planning, budgets — tout en un. L'IA automatise vos taches repetitives et vous alerte avant que les problemes surviennent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
              Essai gratuit 14 jours
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
              Voir les fonctionnalites
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-400">Sans engagement · Sans carte bancaire · Support inclus</p>
        </div>
      </section>

      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-sm font-semibold text-slate-300">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Tout ce dont une PME BTP a besoin</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Un seul outil pour remplacer vos tableurs, vos post-its et vos reunions de suivi.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Ils ont digitalise leur BTP</h2>
            <p className="text-lg text-slate-600">Des retours d'experience de professionnels comme vous.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 mb-5 leading-relaxed text-sm">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Des tarifs adaptes aux PME</h2>
            <p className="text-lg text-slate-600">Aucun frais cache. Resiliez a tout moment.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {pricing.map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 border-2 transition-all ${p.popular ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-105' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}`}>
                {p.popular && <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-4">POPULAIRE</div>}
                <h3 className={`text-xl font-bold mb-1 ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                <p className={`text-sm mb-4 ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="mb-6">
                  {p.price === 'Sur devis' ? (
                    <p className={`text-3xl font-bold ${p.popular ? 'text-white' : 'text-slate-900'}`}>Sur devis</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-extrabold ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.price}€</span>
                      <span className={`text-sm mb-1 ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>/mois</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.popular ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={p.popular ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`block text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all ${p.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Questions frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pret a prendre le controle de vos chantiers ?</h2>
          <p className="text-lg text-slate-400 mb-8">Rejoignez +500 PME du BTP qui pilotent leur activite avec Batium.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all hover:shadow-lg hover:-translate-y-0.5">
            Commencer gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-12 bg-slate-950 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Batium" className="w-7 h-7 object-contain opacity-70" />
              <span className="font-bold text-slate-400 tracking-wide">BATIUM</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors">Mentions legales</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Confidentialite</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
            </div>
            <p className="text-sm text-slate-600">© 2025 Batium. Tous droits reserves.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
