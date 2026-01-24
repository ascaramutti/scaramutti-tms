import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Plus, AlertCircle, RefreshCw } from "lucide-react"; 
import { dashboardService } from "../services/dashboard.service";
import { StatsCards } from "../components/dashboard/StatsCards";
import type { DashboardStats } from "../interfaces/dashboard.interface";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); 

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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Resumen General</h2>
                        <p className="text-sm text-gray-600 mt-1">Estadísticas del área de operaciones</p>
                    </div>
                    
                    {/* Botón visible para todos EXCEPTO dispatcher */}
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

                {/* MANEJO DE ESTADOS: ERROR, CARGANDO, O DATOS */}
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

                {/* Grid para las listas futuras */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Aquí irán ServicesList, DriversList, etc. */}
                </div>
            </main>
        </div>
    );
}