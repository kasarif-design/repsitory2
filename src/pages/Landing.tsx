import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  FileText,
  Calendar,
  Bell,
  HardHat,
  X,
  Star,
  Clock,
  AlertTriangle,
  TrendingDown,
  BrainCircuit,
  CalendarCheck,
  RefreshCw,
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'Est-ce que je dois entrer ma carte bancaire pour l\'essai ?',
    answer: 'Non. L\'essai gratuit de 14 jours est accessible sans carte bancaire. Vous n\'êtes facturé qu\'à la fin de la période d\'essai, si vous décidez de continuer.',
  },
  {
    question: 'Combien de temps faut-il pour commencer ?',
    answer: 'Moins de 5 minutes. Vous créez votre compte, vous importez vos chantiers en cours, et c\'est parti. Pas de formation requise.',
  },
  {
    question: 'Est-ce adapté aux petites entreprises du BTP ?',
    answer: 'BATIUM est fait pour vous. Artisans, PME, 1 à 50 salariés — l\'outil est simple, direct, sans jargon tech.',
  },
  {
    question: 'Puis-je résilier à tout moment ?',
    answer: 'Oui. Pas d\'engagement, pas de frais de résiliation. Vous arrêtez quand vous voulez, en un clic.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Toutes vos données sont chiffrées et hébergées en France. Vous restez propriétaire de vos données, toujours.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left gap-4"
      >
        <span className="text-base font-semibold text-[#1E3A5F]">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#6B7280] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-48 pb-5' : 'max-h-0'}`}>
        <p className="text-[#6B7280] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F9FC]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FEF3C7] text-[#92400E] rounded-full text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
                </span>
                Essai gratuit 14 jours — sans carte bancaire
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E3A5F] leading-[1.1] tracking-tight">
                Vous perdez du temps sur vos chantiers.{' '}
                <span className="text-[#F59E0B]">Tous les jours.</span>
              </h1>

              <p className="mt-6 text-xl text-[#6B7280] leading-relaxed max-w-lg">
                Devis, planning, relances… si tout est dans votre tête ou sur Excel, vous perdez de l'argent.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-lg rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    Essayer gratuitement 14 jours
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <a href="#features">
                  <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#1E3A5F] text-[#1E3A5F] font-semibold text-lg rounded-full hover:bg-[#1E3A5F] hover:text-white transition-all duration-200">
                    Voir comment ça marche
                  </button>
                </a>
              </div>

              <p className="mt-4 text-sm text-[#6B7280] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Aucune carte bancaire — prêt en 5 minutes
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#1E3A5F]/10 to-[#F59E0B]/10 rounded-3xl blur-xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F9FC] border-b border-[#E5E7EB]">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-[#6B7280] font-medium">BATIUM — Tableau de bord</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Chantiers actifs', value: '12', trend: '+3 ce mois', color: 'text-[#1E3A5F]' },
                      { label: 'Devis en attente', value: '5', trend: '2 à relancer', color: 'text-[#F59E0B]' },
                      { label: 'Factures envoyées', value: '28 450€', trend: '+12% vs mois dernier', color: 'text-green-600' },
                      { label: 'Tâches en retard', value: '3', trend: 'À traiter', color: 'text-red-500' },
                    ].map((card) => (
                      <div key={card.label} className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] font-medium">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{card.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-[#1E3A5F] mb-3">Chantiers en cours</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Rénovation Dupont', progress: 75, status: 'En cours' },
                        { name: 'Extension Martin', progress: 40, status: 'En cours' },
                        { name: 'Toiture Bernard', progress: 90, status: 'Finition' },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium text-[#1E3A5F]">{item.name}</span>
                              <span className="text-xs text-[#6B7280]">{item.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-[#E5E7EB] rounded-full">
                              <div
                                className="h-1.5 bg-[#F59E0B] rounded-full transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Soyons honnêtes.</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            {[
              { icon: Bell, text: 'Vous oubliez des relances' },
              { icon: AlertTriangle, text: 'Vos chantiers sont mal suivis' },
              { icon: BrainCircuit, text: 'Vous perdez du temps à chercher des infos' },
              { icon: TrendingDown, text: 'Vous gérez tout dans votre tête' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-[#1E3A5F] font-medium">{text}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#1E3A5F]">
              Et ça vous coûte du temps. Et de l'argent.
            </p>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-sm font-semibold mb-6">
            La solution
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-6">
            BATIUM fait le boulot pour vous.
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Tout est centralisé. Tout est automatisé. Vous gardez le contrôle sans y passer vos soirées.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Ce que BATIUM fait pour vous</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: 'Vos devis en 2 minutes',
                desc: 'Générez des devis professionnels en quelques clics. Plus de copier-coller, plus d\'oublis.',
              },
              {
                icon: CalendarCheck,
                title: 'Votre planning clair, enfin',
                desc: 'Visualisez tous vos chantiers sur un seul écran. Qui fait quoi, quand, où.',
              },
              {
                icon: RefreshCw,
                title: 'Relances automatiques',
                desc: 'BATIUM relance vos clients à votre place. Vous ne perdez plus d\'argent par oubli.',
              },
              {
                icon: LayoutGrid,
                title: 'Vue complète de vos chantiers',
                desc: 'Avancement, équipes, dépenses — tout en un seul endroit, en temps réel.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-[#FEF3C7] rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Avant. Après.</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Before */}
            <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-lg font-bold text-red-700">Avant BATIUM</span>
              </div>
              <ul className="space-y-4">
                {['Stress constant', 'Oublis de relances', 'Retards sur chantiers', 'Désorganisation totale'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-red-800 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <span className="text-lg font-bold text-[#1E3A5F]">Avec BATIUM</span>
              </div>
              <ul className="space-y-4">
                {['Tout est clair', 'Tout est organisé', 'Tout est automatisé', 'Vous êtes sous contrôle'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#1E3A5F] flex-shrink-0" />
                    <span className="text-[#1E3A5F] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-widest mb-4">Ils nous font confiance</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">
              Des centaines d'entreprises du BTP simplifient déjà leur gestion
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'En 3 semaines, j\'ai récupéré au moins 6 heures par semaine. Je n\'envoie plus un seul devis à la main.',
                author: 'Julien R.',
                role: 'Gérant, Entreprise de maçonnerie',
                avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
              },
              {
                quote: 'Mes chantiers sont enfin suivis correctement. Plus d\'oublis, plus de clients mécontents.',
                author: 'Pascal M.',
                role: 'Artisan électricien, 8 salariés',
                avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
              },
              {
                quote: 'Simple, efficace. J\'aurais dû commencer bien plus tôt. Mon comptable m\'a remercié.',
                author: 'Nathalie V.',
                role: 'Dirigeante, PME BTP 15 personnes',
                avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
              },
            ].map((t) => (
              <div key={t.author} className="bg-[#F7F9FC] border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-[#1E3A5F] leading-relaxed mb-6 font-medium">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-[#1E3A5F]">{t.author}</p>
                    <p className="text-xs text-[#6B7280]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]" id="pricing">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-3">
              Un outil. Un prix. Pas de surprise.
            </h2>
            <p className="text-[#6B7280]">Tout ce dont vous avez besoin, dans un seul abonnement.</p>
          </div>

          <div className="relative bg-white rounded-2xl shadow-xl border-2 border-[#F59E0B] p-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-5 py-1.5 bg-[#F59E0B] text-white text-sm font-bold rounded-full shadow">
                Le plus populaire
              </span>
            </div>

            <div className="mb-2">
              <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-widest">BATIUM PRO</span>
            </div>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-6xl font-bold text-[#1E3A5F]">49,99</span>
              <span className="text-xl text-[#6B7280] mb-2">€/mois</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-8">Facturé mensuellement. Résiliable à tout moment.</p>

            <ul className="space-y-4 mb-10 text-left">
              {[
                'Chantiers illimités',
                'Devis + factures illimitées',
                'Planning visuel',
                'Relances automatiques',
                'Multi-utilisateurs',
                'Support prioritaire',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                  <span className="text-[#1E3A5F] font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <Link to="/signup">
              <button className="w-full py-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-lg rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Commencer maintenant
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* RISK REVERSAL */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-10">Essayez sans risque</h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: '14 jours gratuits', desc: 'Accès complet à toutes les fonctionnalités, sans limitation.' },
              { icon: CreditCard, title: 'Pas de carte bancaire', desc: 'Aucune information de paiement requise pour démarrer.' },
              { icon: ShieldCheck, title: 'Résiliation à tout moment', desc: 'Pas d\'engagement. Vous arrêtez quand vous voulez.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#F7F9FC] border border-[#E5E7EB] rounded-2xl p-6">
                <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#1E3A5F]" />
                </div>
                <h3 className="font-bold text-[#1E3A5F] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Questions fréquentes</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1E3A5F]">
        <div className="max-w-4xl mx-auto text-center">
          <HardHat className="w-14 h-14 text-[#F59E0B] mx-auto mb-8" />
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Continuez comme avant…<br />
            ou reprenez le contrôle.
          </h2>
          <p className="text-xl text-blue-200 mb-10">
            5 minutes pour commencer. Des heures gagnées chaque semaine.
          </p>
          <Link to="/signup">
            <button className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xl rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1">
              Essayer gratuitement 14 jours
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
          <p className="mt-5 text-sm text-blue-300">Aucune carte bancaire — prêt en 5 minutes</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1E3A5F] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HardHat className="w-7 h-7 text-[#F59E0B]" />
                <span className="font-bold text-xl text-white">BATIUM</span>
              </div>
              <p className="text-blue-300 text-sm leading-relaxed">
                Le logiciel de gestion pensé pour les entreprises du BTP. Simple, rapide, efficace.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2.5">
                {['Fonctionnalités', 'Tarifs', 'Nouveautés'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Ressources</h4>
              <ul className="space-y-2.5">
                {['Guide de démarrage', 'Blog', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2.5">
                {['Mentions légales', 'Confidentialité', 'CGU'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-blue-400 text-sm">© 2026 BATIUM. Tous droits réservés.</p>
            <p className="text-blue-400 text-sm">Fait pour les pros du BTP 🏗️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
