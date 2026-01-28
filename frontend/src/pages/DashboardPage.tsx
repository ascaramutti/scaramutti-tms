import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Plus, AlertCircle, RefreshCw, Search, ChevronRight } from "lucide-react";
import { dashboardService } from "../services/dashboard.service";
import { servicesService } from "../services/services.service";
import { StatsCards } from "../components/dashboard/StatsCards";
import { ServiceDetailModal } from "../components/services/ServiceDetailModal";
import type { DashboardStats } from "../interfaces/dashboard.interface";
import type { Service } from "../interfaces/services.interface";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Recent Activity State
    const [recentServices, setRecentServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [totalServices, setTotalServices] = useState<number>(0);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadRecentActivity();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, page, statusFilter]);

    const loadRecentActivity = async () => {
        try {
            setIsLoadingServices(true);
            const { services, total } = await servicesService.getServices({
                limit: 10,
                sort: 'recent',
                search: searchTerm,
                offset: (page - 1) * 10,
                ...(statusFilter !== 'all' && { status: statusFilter })
            });
            setRecentServices(services);
            setTotalServices(total);
        } catch (error) {
            console.error('Error loading recent activity:', error);
            toast.error('Error al cargar actividad reciente');
        } finally {
            setIsLoadingServices(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1); // Reset to first page on search
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPage(1); // Reset to first page on filter change
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending_assignment: 'Pendiente Asignación',
            pending_start: 'Pendiente Inicio',
            in_progress: 'En Ruta',
            completed: 'Completado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setError("No se pudieron cargar las métricas. Por favor intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleNavigate = (route: string) => {
        navigate(route);
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
            {/* Header exacto del prototipo */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sistema de Control de Viajes</h1>
                            <p className="text-sm text-gray-600 mt-1">Dashboard de Operaciones</p>
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* 1. Header del Dashboard y Botones */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Resumen General</h2>
                        <p className="text-sm text-gray-600 mt-1">Estadísticas del área de operaciones</p>
                    </div>

                    {user?.role !== 'dispatcher' && (
                        <button
                            onClick={() => handleNavigate('/create-service')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Servicio
                        </button>
                    )}
                </div>

                {/* 2. Tarjetas de Estadísticas (KPIs) */}
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-red-900 mb-2">Error de conexión</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchStats}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Intentar nuevamente
                        </button>
                    </div>
                ) : (
                    <StatsCards
                        stats={stats}
                        isLoading={loading}
                        onNavigate={handleNavigate}
                    />
                )}

                {/* Separador Visual */}
                <div className="my-8 border-t border-gray-200"></div>

                {/* 3. Sección de Búsqueda y Lista - MEJORADA */}
                <div className="space-y-6">

                    {/* Header con Búsqueda */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Servicios</h2>
                            <p className="text-sm text-gray-600 mt-1">Se muestran los servicios desde el más reciente</p>
                        </div>
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar ID, Cliente, Ruta..."
                                className="block w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                onChange={(e) => handleSearch(e.target.value)}
                                value={searchTerm}
                            />
                        </div>
                    </div>

                    {/* Filtros por Estado */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleStatusFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'all'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => handleStatusFilter('pending_assignment')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'pending_assignment'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                                }`}
                        >
                            Pendiente Asignación
                        </button>
                        <button
                            onClick={() => handleStatusFilter('pending_start')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'pending_start'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                }`}
                        >
                            Pendiente Inicio
                        </button>
                        <button
                            onClick={() => handleStatusFilter('in_progress')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'in_progress'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                        >
                            En Ruta
                        </button>
                        <button
                            onClick={() => handleStatusFilter('completed')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'completed'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                }`}
                        >
                            Completado
                        </button>
                        <button
                            onClick={() => handleStatusFilter('cancelled')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'cancelled'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                }`}
                        >
                            Cancelado
                        </button>
                    </div>

                    {/* Tabla de Resultados con Loading State */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Est.</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Ver</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoadingServices ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                                    <p className="text-sm text-gray-500">Cargando servicios...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : recentServices.length > 0 ? (
                                        recentServices.map((service) => (
                                            <tr
                                                key={service.id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedService(service)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{service.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{service.client_name}</div>
                                                    <div className="text-xs text-gray-500">{service.client_ruc}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">{service.origin}</span>
                                                        <span className="mx-1">→</span>
                                                        <span className="font-medium text-gray-900">{service.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${service.status_name === 'pending_assignment' ? 'bg-yellow-100 text-yellow-800' :
                                                            service.status_name === 'pending_start' ? 'bg-orange-100 text-orange-800' :
                                                                service.status_name === 'in_progress' ? 'bg-emerald-100 text-emerald-800' :
                                                                    service.status_name === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                        service.status_name === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                            'bg-gray-100 text-gray-800'}`}>
                                                        {getStatusLabel(service.status_name)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(service.tentative_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'No se encontraron servicios con los filtros aplicados'
                                                    : 'No hay actividad reciente'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                                {recentServices.length > 0 ? (
                                    <>
                                        Mostrando <span className="font-semibold text-gray-900">{(page - 1) * 10 + 1}-{(page - 1) * 10 + recentServices.length}</span> de{' '}
                                        <span className="font-semibold text-gray-900">{totalServices}</span> servicios
                                    </>
                                ) : (
                                    'No hay servicios para mostrar'
                                )}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={recentServices.length < 10}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <ServiceDetailModal
                    isOpen={!!selectedService}
                    onClose={() => setSelectedService(null)}
                    service={selectedService}
                />
            </main>
        </div>
    );
}