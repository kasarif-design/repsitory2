import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { TrendingUp, TrendingDown, Users, Eye, Clock, MousePointer } from 'lucide-react';

const stats = [
  {
    name: 'Visiteurs uniques',
    value: '12,543',
    change: '+14.2%',
    trend: 'up',
    icon: Users,
  },
  {
    name: 'Pages vues',
    value: '45,234',
    change: '+8.1%',
    trend: 'up',
    icon: Eye,
  },
  {
    name: 'Duree moyenne',
    value: '4m 32s',
    change: '-2.3%',
    trend: 'down',
    icon: Clock,
  },
  {
    name: 'Taux de clic',
    value: '3.24%',
    change: '+0.8%',
    trend: 'up',
    icon: MousePointer,
  },
];

const chartData = [
  { day: 'Lun', value: 65 },
  { day: 'Mar', value: 78 },
  { day: 'Mer', value: 52 },
  { day: 'Jeu', value: 89 },
  { day: 'Ven', value: 95 },
  { day: 'Sam', value: 45 },
  { day: 'Dim', value: 38 },
];

const topPages = [
  { page: '/accueil', views: 12453, percentage: 28 },
  { page: '/produits', views: 8234, percentage: 18 },
  { page: '/tarifs', views: 6543, percentage: 15 },
  { page: '/contact', views: 4321, percentage: 10 },
  { page: '/blog', views: 3210, percentage: 7 },
];

const trafficSources = [
  { source: 'Recherche organique', visits: 8432, color: 'bg-slate-700' },
  { source: 'Direct', visits: 5234, color: 'bg-slate-500' },
  { source: 'Reseaux sociaux', visits: 3421, color: 'bg-slate-400' },
  { source: 'Referral', visits: 2134, color: 'bg-slate-300' },
  { source: 'Email', visits: 1234, color: 'bg-slate-200' },
];

export function Analytics() {
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const totalVisits = trafficSources.reduce((sum, s) => sum + s.visits, 0);

  return (
    <AppLayout
      title="Analytiques"
      description="Suivez les performances et l'engagement de vos utilisateurs."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <stat.icon className="w-5 h-5 text-slate-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Visiteurs cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((data) => (
                <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-slate-900 rounded-t transition-all hover:bg-slate-700"
                    style={{ height: `${(data.value / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources de trafic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficSources.map((source) => (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">{source.source}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {source.visits.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${source.color} rounded-full transition-all`}
                      style={{ width: `${(source.visits / totalVisits) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pages les plus visitees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Page</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Vues</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 hidden sm:table-cell">Part</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell w-48">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page) => (
                  <tr key={page.page} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{page.page}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {page.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 hidden sm:table-cell">
                      {page.percentage}%
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-700 rounded-full"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
