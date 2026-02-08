import { Clock, MapPin, Package, UserCircle, Truck, Ruler, Weight, User, Play, CheckCircle, AlertCircle, Users } from 'lucide-react';
import type { ServiceCardProps } from '../../interfaces/components.interface';

export function ServiceCard({ service, variant = 'pending', onAction, onViewDetail }: ServiceCardProps) {

  // Configuración de variantes de estado
  const config = {
    pending: {
      color: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600',
      label: 'Pendiente',
      actionLabel: 'Asignar Recursos',
      actionIcon: Truck,
      showResources: false,
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-700',
      badgeIcon: 'text-yellow-900'
    },
    pending_start: {
      color: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      label: 'Pendiente de Inicio',
      actionLabel: 'Iniciar Servicio',
      actionIcon: Play,
      showResources: true,
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      badgeIcon: 'text-orange-900'
    },
    in_progress: {
      color: 'bg-emerald-500',
      hover: 'hover:bg-emerald-600',
      label: 'En Ejecución',
      actionLabel: 'Finalizar Servicio',
      actionIcon: CheckCircle,
      showResources: true,
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeIcon: 'text-emerald-900'
    }
  }[variant];

  // Helper para formatear dimensiones dinámicamente
  const formatDimensions = () => {
    const parts = [];
    if (service.length && service.length > 0) parts.push(`L${service.length}m`);
    if (service.width && service.width > 0) parts.push(`A${service.width}m`);
    if (service.height && service.height > 0) parts.push(`H${service.height}m`);

    return parts.join(' x ');
  };

  const dimensionsStr = formatDimensions();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Dynamic Status Color */}
      <div
        className={`${config.color} px-6 py-4 cursor-pointer ${config.hover} transition-colors`}
        onClick={() => onViewDetail?.(service.id)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Servicio #{service.id}
            {service.observations && (
              <div className="group relative">
                <AlertCircle className="w-5 h-5 text-white stroke-2" />
              </div>
            )}
          </h3>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Client */}
        <div>
          <div className="flex items-start gap-2 text-sm">
            <UserCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-700 mb-1">Cliente</p>
              <p className="text-gray-600">{service.client_name}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        {/* Cargo */}
        <div>
          <div className="flex items-start gap-2 text-sm">
            <Package className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-700 mb-1">Carga</p>
              <p className="text-gray-600">{service.cargo_type_name}</p>

              {/* Dimensiones y Peso */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {dimensionsStr && (
                  <span className='inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-xs text-gray-600'>
                    <Ruler className="w-3 h-3 text-gray-400" />
                    {dimensionsStr}
                  </span>
                )}

                {service.weight > 0 && (
                  <span className='inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-xs text-gray-600'>
                    <Weight className="w-3 h-3 text-gray-400" />
                    {service.weight} kg
                  </span>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        {/* Origin */}
        <div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-gray-700 mb-1">Origen</p>
              <p className="text-gray-600">{service.origin}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        {/* Destination */}
        <div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-gray-700 mb-1">Destino</p>
              <p className="text-gray-600">{service.destination}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        {/* Info Grid (Date + Resources if applicable) */}
        <div className="space-y-4">
          {variant === 'in_progress' && service.start_date_time ? (
            <div className="flex items-center justify-between text-sm bg-emerald-50 p-2 rounded-lg -mx-2">
              <span className="text-emerald-700 font-medium">Fecha Inicio</span>
              <div className="flex items-center gap-1 text-emerald-900">
                <Clock className="w-4 h-4" />
                <span className="font-bold">
                  {new Date(service.start_date_time).toLocaleDateString()} {new Date(service.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fecha Tentativa</span>
              <div className="flex items-center gap-1 text-gray-900">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {new Date(service.tentative_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Mostrar recursos asignados solo si la variante lo permite */}
          {config.showResources && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Conductor</span>
                <div className="flex items-center gap-1 text-gray-900">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{service.driver_name || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Unidad</span>
                <div className="flex items-center gap-1 text-gray-900">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">
                    {service.tractor_plate || 'N/A'}
                    {service.trailer_plate ? ` / ${service.trailer_plate}` : ''}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* US-003: Mostrar contador de asignaciones adicionales (independiente del estado) */}
          {service.additionalAssignmentsCount !== undefined && service.additionalAssignmentsCount > 0 && (
            <div className={`flex items-center justify-between text-sm ${config.badgeBg} p-2 rounded-lg -mx-2`}>
              <span className={`${config.badgeText} font-medium`}>Asignaciones adicionales</span>
              <div className={`flex items-center gap-1 ${config.badgeIcon}`}>
                <Users className="w-4 h-4" />
                <span className="font-bold">{service.additionalAssignmentsCount}</span>
              </div>
            </div>
          )}

          {onAction && (
            <div className="pt-2">
              <button
                onClick={() => onAction(service.id)}
                className={`w-full ${config.color} text-white py-2 px-4 rounded-lg ${config.hover} transition-colors text-sm font-medium flex items-center justify-center gap-2`}
              >
                <config.actionIcon className="w-4 h-4" />
                {config.actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}