import { Clock, MapPin, Package, UserCircle, Truck, Ruler, Weight } from 'lucide-react';
import type { Service } from '../../interfaces/services.interface';

interface ServiceCardProps {
  service: Service;
  onAssign?: (id: number) => void;
  onViewDetail?: (id: number) => void;
}

export function ServiceCard({ service, onAssign, onViewDetail }: ServiceCardProps) {

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
      {/* Header with Status Color */}
      <div 
        className="bg-yellow-500 px-6 py-4 cursor-pointer hover:bg-yellow-600 transition-colors"
        onClick={() => onViewDetail?.(service.id)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Servicio #{service.id}
          </h3>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white">
            Pendiente
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

        {/* Date & Action */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fecha Tentativa</span>
            <div className="flex items-center gap-1 text-gray-900">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                  {new Date(service.tentative_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {onAssign && (
            <div className="pt-2">
              <button
                onClick={() => onAssign(service.id)}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                Asignar Recursos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}