import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, ArrowLeft, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { servicesService } from '../../services/services.service';
import type { Service } from '../../interfaces/services.interface';
import { ServiceCard } from '../../components/services/ServiceCard';
import { ServiceDetailModal } from '../../components/services/ServiceDetailModal';
import { toast } from 'sonner';

export default function PendingStartServicesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Definir roles permitidos
  const canModify = ['admin', 'dispatcher', 'general_manager', 'operations_manager'].includes(user?.role || '');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await servicesService.getServices({ status: 'pending_start' });
      setServices(data);
    } catch (error) {
      console.error('Error loading pending start services:', error);
      toast.error('No se pudieron cargar los servicios pendientes de inicio');
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = (serviceId: number) => {
    toast.info(`Iniciar servicio #${serviceId} (Próximamente)`);
  };

  const handleViewDetail = async (serviceId: number) => {
    try {
        const fullService = await servicesService.getServiceById(serviceId);
        setSelectedService(fullService);
    } catch (error) {
        console.error('Error fetching service detail:', error);
        toast.error('No se pudo cargar el detalle del servicio');
    }
  };

  const getRoleName = (role: string = '') => {
    const roles: Record<string, string> = {
        admin: 'Administrador',
        dispatcher: 'Despachador',
        driver: 'Conductor',
        general_manager: 'Gerente General',
        operations_manager: 'Gerente de Operaciones',
        sales: 'Ventas'
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Servicios Pendientes de Inicio</h1>
                <p className="text-sm text-gray-600 mt-1">
                    {loading ? 'Cargando...' : `${services.length} servicios esperando inicio`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{getRoleName(user?.role)}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
             <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
        ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                    <ServiceCard 
                        key={service.id} 
                        service={service} 
                        variant="pending_start" 
                        onAction={canModify ? handleStartService : undefined}
                        onViewDetail={handleViewDetail}
                    />
                ))}
            </div>
        ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Timer className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay servicios pendientes de inicio</h3>
                    <p className="text-gray-600">Todos los servicios asignados han sido iniciados.</p>
                </div>
            </div>
        )}
      </main>

      <ServiceDetailModal 
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
      />
    </div>
  );
}