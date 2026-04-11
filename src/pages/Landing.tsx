import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  CheckCircle,
  BarChart3,
  Lock,
  Globe,
  Clock,
  Headphones,
  Star,
  ChevronDown,
  Play,
  Building2,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui';
import { PublicHeader } from '../components/layout/Header';
import { useState } from 'react';

const features = [
  {
    icon: BarChart3,
    title: 'Tableaux de bord analytiques',
    description: 'Visualisez vos donnees en temps reel avec des graphiques interactifs et des KPIs personnalisables.',
  },
  {
    icon: Users,
    title: 'Gestion d\'equipe',
    description: 'Invitez vos collaborateurs, definissez les roles et gerez les permissions en quelques clics.',
  },
  {
    icon: Lock,
    title: 'Securite entreprise',
    description: 'Chiffrement de bout en bout, SSO, authentification 2FA et conformite RGPD garantie.',
  },
  {
    icon: Zap,
    title: 'Automatisations',
    description: 'Creez des workflows automatises pour gagner du temps sur vos taches repetitives.',
  },
  {
    icon: Globe,
    title: 'API ouverte',
    description: 'Integrez notre solution a vos outils existants grace a notre API REST documentee.',
  },
  {
    icon: Headphones,
    title: 'Support prioritaire',
    description: 'Une equipe dediee disponible 24/7 pour vous accompagner dans votre succes.',
  },
];

const stats = [
  { value: '10K+', label: 'Entreprises clientes' },
  { value: '99.9%', label: 'Disponibilite' },
  { value: '50M+', label: 'Operations/jour' },
  { value: '<100ms', label: 'Temps de reponse' },
];

const testimonials = [
  {
    quote: 'Cette solution a transforme notre facon de travailler. Nous avons gagne 40% de productivite en 3 mois.',
    author: 'Marie Dupont',
    role: 'Directrice Operations',
    company: 'TechCorp France',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  },
  {
    quote: 'L\'integration a ete transparente et le support client est exceptionnel. Je recommande vivement.',
    author: 'Thomas Martin',
    role: 'CTO',
    company: 'StartupFlow',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  },
  {
    quote: 'Enfin une plateforme qui comprend les besoins des equipes modernes. Simple, puissant, efficace.',
    author: 'Sophie Bernard',
    role: 'Head of Product',
    company: 'InnovateLab',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    description: 'Pour les petites equipes qui demarrent',
    price: '29',
    period: '/mois',
    features: [
      'Jusqu\'a 5 utilisateurs',
      '10 Go de stockage',
      'Tableaux de bord basiques',
      'Support email',
      'Integrations limitees',
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Business',
    description: 'Pour les entreprises en croissance',
    price: '79',
    period: '/mois',
    features: [
      'Jusqu\'a 25 utilisateurs',
      '100 Go de stockage',
      'Tableaux de bord avances',
      'Support prioritaire',
      'Toutes les integrations',
      'API access',
      'SSO (SAML)',
    ],
    cta: 'Essai gratuit',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Pour les grandes organisations',
    price: 'Sur mesure',
    period: '',
    features: [
      'Utilisateurs illimites',
      'Stockage illimite',
      'Fonctionnalites personnalisees',
      'Account manager dedie',
      'SLA garanti 99.99%',
      'Deploiement on-premise',
      'Formation sur site',
    ],
    cta: 'Nous contacter',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'Vous beneficiez de 14 jours d\'acces complet a toutes les fonctionnalites du plan Business, sans engagement et sans carte bancaire. A la fin de l\'essai, vous pouvez choisir le plan qui vous convient.',
  },
  {
    question: 'Puis-je changer de plan a tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre plan a tout moment. Le changement prend effet immediatement et la facturation est ajustee au prorata.',
  },
  {
    question: 'Mes donnees sont-elles securisees ?',
    answer: 'Absolument. Nous utilisons un chiffrement AES-256 pour les donnees au repos et TLS 1.3 pour les donnees en transit. Nos serveurs sont heberges dans des datacenters certifies ISO 27001 en Europe.',
  },
  {
    question: 'Proposez-vous des formations ?',
    answer: 'Oui, nous proposons des webinaires gratuits chaque semaine, une documentation complete, et des formations personnalisees pour les clients Enterprise.',
  },
  {
    question: 'Quelles integrations sont disponibles ?',
    answer: 'Nous nous integrons avec plus de 100 outils : Slack, Microsoft Teams, Salesforce, HubSpot, Zapier, Google Workspace, et bien d\'autres. Notre API permet egalement de creer vos propres integrations.',
  },
];

const logos = [
  'TechCorp', 'InnovateLab', 'StartupFlow', 'DataFirst', 'CloudNine', 'ScaleUp'
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-slate-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}
      >
        <p className="text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Nouveau : Integrations Zapier disponibles
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              La plateforme qui
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500">
                accelere votre business
              </span>
            </h1>
            <p className="mt-8 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Centralisez vos operations, automatisez vos workflows et prenez des decisions
              eclairees grace a des donnees en temps reel. Rejoignez 10 000+ entreprises.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="group">
                  Demarrer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="group">
                <Play className="mr-2 w-5 h-5" />
                Voir la demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Essai gratuit 14 jours - Aucune carte bancaire requise
            </p>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none h-40 bottom-0 top-auto" />
            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-slate-400">dashboard.app.com</span>
              </div>
              <div className="p-6 bg-slate-900">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Revenus', value: '124,500', trend: '+12.5%' },
                    { label: 'Utilisateurs', value: '8,420', trend: '+8.2%' },
                    { label: 'Conversion', value: '3.24%', trend: '+2.1%' },
                    { label: 'Satisfaction', value: '98%', trend: '+0.5%' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800 rounded-lg p-4">
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                      <p className="text-white text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-green-400 text-sm mt-1">{stat.trend}</p>
                    </div>
                  ))}
                </div>
                <div className="h-48 bg-slate-800 rounded-lg flex items-end justify-around px-6 pb-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="w-6 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-medium text-slate-500 mb-8">
            ILS NOUS FONT CONFIANCE
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {logos.map((logo) => (
              <div key={logo} className="text-xl font-bold text-slate-300 hover:text-slate-400 transition-colors">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              Fonctionnalites
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Une suite complete d'outils pour gerer, analyser et developper votre activite.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-5xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Pourquoi nous choisir
              </span>
              <h2 className="mt-4 text-4xl font-bold text-slate-900">
                Concue pour les equipes ambitieuses
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Notre plateforme est le fruit de 5 ans de R&D et des retours de milliers
                d'entreprises. Chaque fonctionnalite a ete pensee pour maximiser votre productivite.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Croissance acceleree',
                    description: 'Nos clients constatent en moyenne 35% de croissance apres 6 mois.',
                  },
                  {
                    icon: Clock,
                    title: 'Gain de temps',
                    description: 'Automatisez les taches repetitives et liberez 10h par semaine.',
                  },
                  {
                    icon: Layers,
                    title: 'Integration native',
                    description: 'Connectez tous vos outils en quelques clics, sans code.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl transform rotate-3" />
              <div className="relative bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Configuration terminee</p>
                    <p className="text-sm text-slate-500">Votre espace est pret</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    'Compte cree',
                    'Equipe invitee',
                    'Donnees importees',
                    'Integrations connectees',
                    'Premier rapport genere',
                  ].map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  Temps moyen de configuration : 15 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50" id="testimonials">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              Temoignages
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">
              Ce que nos clients disent
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              Tarifs
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">
              Un prix adapte a chaque etape
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Commencez gratuitement, evoluez selon vos besoins. Tous les plans incluent
              l'essai gratuit de 14 jours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-slate-900 text-white ring-4 ring-slate-900 scale-105'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-slate-900 text-sm font-medium rounded-full shadow">
                    Le plus populaire
                  </span>
                )}
                <h3 className={`text-xl font-semibold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                <div className="mt-6 mb-8">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price.includes('mesure') ? '' : ''}{plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.popular ? 'text-slate-300' : 'text-slate-500'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-slate-200' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    fullWidth
                    variant={plan.popular ? 'primary' : 'outline'}
                    className={plan.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : ''}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              FAQ
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">
              Questions frequentes
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Vous avez d'autres questions ?</p>
            <Button variant="outline">
              <Headphones className="w-4 h-4 mr-2" />
              Contacter le support
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-8" />
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pret a transformer votre business ?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Rejoignez les milliers d'entreprises qui ont deja franchi le cap.
            Commencez votre essai gratuit aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                Demarrer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Demander une demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Configuration en 5 minutes - Aucune carte bancaire requise
          </p>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-900" />
                </div>
                <span className="font-bold text-white">AppName</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La plateforme qui accelere votre business. Simplifiez vos operations,
                automatisez vos processus.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-3">
                {['Fonctionnalites', 'Tarifs', 'Integrations', 'API', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Ressources</h4>
              <ul className="space-y-3">
                {['Documentation', 'Guides', 'Blog', 'Communaute', 'Webinaires'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-3">
                {['A propos', 'Carrieres', 'Contact', 'Partenaires', 'Mentions legales'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              2024 AppName. Tous droits reserves.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Confidentialite
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                CGU
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
