import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import { Plus, MoreHorizontal, Calendar, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const projects = [
  {
    id: 1,
    name: 'Refonte du site web',
    description: 'Mise a jour complete du site corporate avec nouveau design',
    status: 'in_progress',
    progress: 65,
    dueDate: '15 mars 2026',
    members: 4,
    tasks: { completed: 12, total: 18 },
  },
  {
    id: 2,
    name: 'Application mobile',
    description: 'Developpement de l\'app iOS et Android',
    status: 'in_progress',
    progress: 32,
    dueDate: '30 avril 2026',
    members: 6,
    tasks: { completed: 8, total: 25 },
  },
  {
    id: 3,
    name: 'Migration cloud',
    description: 'Transfert de l\'infrastructure vers AWS',
    status: 'completed',
    progress: 100,
    dueDate: '1 fevrier 2026',
    members: 3,
    tasks: { completed: 15, total: 15 },
  },
  {
    id: 4,
    name: 'Campagne marketing Q1',
    description: 'Lancement de la nouvelle campagne publicitaire',
    status: 'pending',
    progress: 0,
    dueDate: '20 mars 2026',
    members: 5,
    tasks: { completed: 0, total: 12 },
  },
  {
    id: 5,
    name: 'Integration CRM',
    description: 'Connexion du CRM avec les outils existants',
    status: 'in_progress',
    progress: 78,
    dueDate: '28 fevrier 2026',
    members: 2,
    tasks: { completed: 7, total: 9 },
  },
  {
    id: 6,
    name: 'Formation equipe',
    description: 'Sessions de formation sur les nouveaux outils',
    status: 'pending',
    progress: 0,
    dueDate: '10 avril 2026',
    members: 8,
    tasks: { completed: 0, total: 6 },
  },
];

const statusConfig = {
  completed: {
    label: 'Termine',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'En cours',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock,
  },
  pending: {
    label: 'A venir',
    color: 'bg-slate-100 text-slate-700',
    icon: AlertCircle,
  },
};

export function Projects() {
  return (
    <AppLayout
      title="Projets"
      description="Gerez et suivez l'avancement de vos projets."
      actions={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg">
          Tous ({projects.length})
        </button>
        <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
          En cours ({projects.filter((p) => p.status === 'in_progress').length})
        </button>
        <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
          Termines ({projects.filter((p) => p.status === 'completed').length})
        </button>
        <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
          A venir ({projects.filter((p) => p.status === 'pending').length})
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const status = statusConfig[project.status as keyof typeof statusConfig];
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <status.icon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                  <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Progression</span>
                    <span className="text-sm font-medium text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.progress === 100 ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {project.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {project.members}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {project.tasks.completed}/{project.tasks.total}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
