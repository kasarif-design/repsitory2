import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import { Plus, Mail, MoreHorizontal, Shield, UserCheck, Clock } from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: 'Marie Dupont',
    email: 'marie.dupont@exemple.com',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'active',
    joinedAt: '15 janvier 2025',
  },
  {
    id: 2,
    name: 'Thomas Martin',
    email: 'thomas.martin@exemple.com',
    role: 'member',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'active',
    joinedAt: '3 fevrier 2025',
  },
  {
    id: 3,
    name: 'Sophie Bernard',
    email: 'sophie.bernard@exemple.com',
    role: 'member',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'active',
    joinedAt: '20 fevrier 2025',
  },
  {
    id: 4,
    name: 'Lucas Petit',
    email: 'lucas.petit@exemple.com',
    role: 'viewer',
    avatar: null,
    status: 'pending',
    joinedAt: 'Invitation envoyee',
  },
  {
    id: 5,
    name: 'Emma Leroy',
    email: 'emma.leroy@exemple.com',
    role: 'member',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'active',
    joinedAt: '8 mars 2025',
  },
];

const roleConfig = {
  admin: {
    label: 'Administrateur',
    color: 'bg-slate-900 text-white',
    icon: Shield,
  },
  member: {
    label: 'Membre',
    color: 'bg-slate-100 text-slate-700',
    icon: UserCheck,
  },
  viewer: {
    label: 'Lecteur',
    color: 'bg-slate-50 text-slate-600',
    icon: Clock,
  },
};

const stats = [
  { label: 'Membres actifs', value: teamMembers.filter((m) => m.status === 'active').length },
  { label: 'Invitations en attente', value: teamMembers.filter((m) => m.status === 'pending').length },
  { label: 'Administrateurs', value: teamMembers.filter((m) => m.role === 'admin').length },
];

export function Team() {
  return (
    <AppLayout
      title="Equipe"
      description="Gerez les membres de votre equipe et leurs permissions."
      actions={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Inviter un membre
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="text-center py-6">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Membre</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500 hidden md:table-cell">Role</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500 hidden lg:table-cell">Membre depuis</th>
                <th className="py-4 px-6 text-sm font-medium text-slate-500 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const role = roleConfig[member.role as keyof typeof roleConfig];
                return (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {member.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                        {member.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            En attente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        <role.icon className="w-3.5 h-3.5" />
                        {role.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 hidden lg:table-cell">
                      {member.joinedAt}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Mail className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
