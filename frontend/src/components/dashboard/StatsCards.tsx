import { PlayCircle, Clock, CheckCircle, Users, Truck, Timer } from 'lucide-react';
import type { StatsCardsProps } from '../../interfaces/dashboard.interface.ts';


export function StatsCards({ stats, onNavigate, isLoading }: StatsCardsProps) {

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center p-8 w-full">
        <div className="animate-pulse text-gray-400">Cargando métricas...</div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Pendientes de Asignación',
      value: stats.services.pending_assignment,
      display: stats.services.pending_assignment,
      icon: Clock,
      color: 'bg-yellow-500',
      route: '/services/pending',
      clickable: true,
    },
    {
      title: 'Pendientes de Inicio',
      value: stats.services.pending_start,
      display: stats.services.pending_start,
      icon: Timer,
      color: 'bg-orange-500',
      route: '/services?status=pending_start',
      clickable: true,
    },
    {
      title: 'Servicios en Ejecución',
      value: stats.services.in_progress,
      display: stats.services.in_progress,
      icon: PlayCircle,
      color: 'bg-emerald-500',
      route: '/services?status=in_progress',
      clickable: true,
    },
    {
      title: 'Completados esta Semana',
      value: stats.services.completed_week,
      display: stats.services.completed_week,
      icon: CheckCircle,
      color: 'bg-blue-500',
      route: '/services?status=completed',
      clickable: false,
    },
    {
      title: 'Conductores en Servicio',
      value: stats.resources_on_road.drivers_active,
      display: `${stats.resources_on_road.drivers_active}/${stats.resources_on_road.drivers_total}`,
      icon: Users,
      color: 'bg-green-500',
      clickable: false,
    },
    {
      title: 'Unidades en Servicio',
      value: stats.resources_on_road.tractors_active,
      display: `${stats.resources_on_road.tractors_active}/${stats.resources_on_road.tractors_total}`,
      icon: Truck,
      color: 'bg-purple-500',
      clickable: false,
    }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          onClick={() => card.clickable && onNavigate && onNavigate(card.route || '#')}
          className={`
            bg-white rounded-lg shadow-sm p-6 border border-gray-200 
            w-full sm:w-[calc(50%-2rem)] lg:w-[calc(25%-2rem)] min-w-[250px]
            ${card.clickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`${card.color} p-2 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{card.display}</p>
            <p className="text-sm text-gray-600">{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}