import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User as UserIcon, ArrowLeft, ChevronLeft, ChevronRight, Download, AlertCircle, RefreshCw, Calendar } from "lucide-react";
import { reportsService } from "../../services/reports.service";
import type { WeeklyTripsResponse } from "../../interfaces/reports.interface";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function WeeklyTripsReportPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState<WeeklyTripsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadWeeklyReport();
    }, [weekOffset]);

    const loadWeeklyReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await reportsService.getWeeklyTrips(weekOffset);
            setReportData(data);
        } catch (error) {
            console.error("Error fetching weekly report:", error);
            setError("No se pudo cargar el reporte. Por favor intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportToExcel = async () => {
        if (!reportData) return;

        if (reportData.is_current_week) {
            toast.error("No se puede exportar la semana actual. Solo semanas cerradas pueden ser exportadas.");
            return;
        }

        try {
            setExporting(true);
            const weekLabel = weekOffset === 0 ? 'actual' : `semana_${Math.abs(weekOffset)}`;
            await reportsService.downloadWeeklyTripsExcel(weekOffset, `reporte_viajes_${weekLabel}.xlsx`);
            toast.success("Reporte exportado exitosamente");
        } catch (error) {
            console.error("Error exporting report:", error);
            toast.error("Error al exportar el reporte");
        } finally {
            setExporting(false);
        }
    };

    const handlePreviousWeek = () => {
        setWeekOffset(prev => prev - 1);
    };

    const handleNextWeek = () => {
        // No permitir navegar a semanas futuras
        if (weekOffset < 0) {
            setWeekOffset(prev => prev + 1);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Lima'
        });
    };

    const formatWeekDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'America/Lima'
        });
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
            {/* Header */}
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
                                <h1 className="text-2xl font-bold text-gray-900">Reporte de Viajes Semanales</h1>
                                <p className="text-sm text-gray-600 mt-1">Viajes completados por semana</p>
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Week Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {reportData ? `${formatWeekDate(reportData.week_start)} - ${formatWeekDate(reportData.week_end)}` : 'Cargando...'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {reportData ? (
                                        reportData.is_current_week ? (
                                            <span className="inline-flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Semana actual (datos parciales)
                                            </span>
                                        ) : (
                                            'Semana cerrada'
                                        )
                                    ) : (
                                        'Cargando...'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePreviousWeek}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Anterior
                            </button>
                            <button
                                onClick={handleNextWeek}
                                disabled={weekOffset >= 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleExportToExcel}
                                disabled={!reportData?.can_export || exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exporting ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                                {exporting ? 'Exportando...' : 'Exportar Excel'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-red-900 mb-2">Error de conexión</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={loadWeeklyReport}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Intentar nuevamente
                        </button>
                    </div>
                ) : loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Cargando reporte...</p>
                    </div>
                ) : reportData ? (
                    <>
                        {/* Services Cards */}
                        <div className="space-y-4 mb-6">
                            {reportData?.services && reportData.services.length > 0 ? (
                                reportData.services.map((service, serviceIndex) => {
                                    const isEvenService = serviceIndex % 2 === 0;
                                    const bgColor = isEvenService ? 'bg-white' : 'bg-blue-50';

                                    return (
                                        <div key={service.service_id} className={`${bgColor} rounded-lg shadow-sm border border-gray-200 p-6`}>
                                            {/* Header: Código, Cliente, Precio */}
                                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-300">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-lg font-bold text-gray-900">{service.code}</span>
                                                        <span className="text-gray-400">|</span>
                                                        <span className="text-lg font-semibold text-gray-800">{service.client_name}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {service.origin} <span className="font-bold">→</span> {service.destination} <span className="font-bold">|</span> {service.service_type} <span className="font-bold">|</span> {service.duration}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-blue-600">{service.currency_code} {Number(service.price).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Conductores */}
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm">
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                    <span className="font-medium text-gray-900">{service.principal_driver.driver_name}</span>
                                                    <span className="text-gray-500 ml-2">({service.principal_driver.assignment_note})</span>
                                                </div>
                                                {service.additional_drivers.map((driver, idx) => (
                                                    <div key={idx} className="flex items-center text-sm ml-4">
                                                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                                        <span className="font-medium text-gray-700">{driver.driver_name}</span>
                                                        <span className="text-gray-500 ml-2">({driver.assignment_note})</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer: Fechas */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                                                {formatDate(service.start_date)} - {formatDate(service.end_date)}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                                    No hay viajes completados en esta semana
                                </div>
                            )}
                        </div>

                        {/* Totals by Currency */}
                        {reportData?.totals_by_currency && reportData.totals_by_currency.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Totales por Moneda</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {reportData.totals_by_currency.map((total) => (
                                        <div key={total.currency} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-blue-900">Moneda: {total.currency}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-blue-700">Servicios:</span>
                                                    <span className="text-lg font-bold text-blue-900">{total.total_services}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-blue-700">Total:</span>
                                                    <span className="text-xl font-bold text-blue-900">{total.currency} {total.total_revenue.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </main>
        </div>
    );
}
