import { X, MapPin, Calendar, User, Truck, DollarSign, Package, AlertCircle, FileText } from 'lucide-react';
import type { Service } from '../../interfaces/services.interface';

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
}

export function ServiceDetailModal({ isOpen, onClose, service }: ServiceDetailModalProps) {
    if (!isOpen || !service) return null;

    const formatCurrency = (amount: number, currencyCode: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        // Mismos colores que las cards
        const map: Record<string, string> = {
            'in_progress': 'bg-emerald-500',
            'pending_start': 'bg-orange-500',
            'pending_assignment': 'bg-yellow-500',
            'completed': 'bg-blue-500',
            'cancelled': 'bg-red-500'
        };
        return map[status] || 'bg-gray-500';
    };

    const getStatusName = (status: string) => {
        const map: Record<string, string> = {
            'in_progress': 'En Ejecución',
            'pending_start': 'Pendiente de Inicio',
            'pending_assignment': 'Pendiente',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };
        return map[status] || status;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header Dinámico */}
                <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 text-white ${getStatusColor(service.status_name)}`}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            Servicio #{service.id}
                        </h2>
                        <span className="text-white/80 text-sm font-medium">
                            {getStatusName(service.status_name)}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Grid Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Cliente y Carga */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Información General</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    {/* Cliente */}
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Cliente</p>
                                            <p className="font-semibold text-gray-900">{service.client_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">RUC: {service.client_ruc}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200"></div>
                                    {/* Carga */}
                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                            <Package className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Carga</p>
                                            <p className="font-semibold text-gray-900">{service.cargo_type_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {[
                                                    service.length ? `L${service.length}m` : null,
                                                    service.width ? `A${service.width}m` : null,
                                                    service.height ? `H${service.height}m` : null,
                                                    service.weight ? `${service.weight}kg` : null
                                                ].filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ruta */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Ruta</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-4 relative overflow-hidden">
                                    <div className="absolute top-4 left-4 bottom-4 w-0.5 bg-gray-200 ml-2"></div>

                                    <div className="relative flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-green-500 relative z-10 bg-gray-50" />
                                        <div>
                                            <p className="text-sm text-gray-500">Origen</p>
                                            <p className="font-medium text-gray-900">{service.origin}</p>
                                        </div>
                                    </div>

                                    <div className="relative flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-red-500 relative z-10 bg-gray-50" />
                                        <div>
                                            <p className="text-sm text-gray-500">Destino</p>
                                            <p className="font-medium text-gray-900">{service.destination}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recursos */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recursos Asignados</h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500">Conductor</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{service.driver_name || 'No asignado'}</span>
                                </div>
                                <div className="border-t border-gray-200"></div>
                                {(service.tractor_plate || service.trailer_plate) ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-500">Unidades</span>
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {service.tractor_plate || 'N/A'}
                                                {service.trailer_plate ? ` / ${service.trailer_plate}` : ''}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-400 italic text-center py-1">Unidades no asignadas</div>
                                )}
                            </div>
                        </div>

                        {/* Fechas y Finanzas */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalles Operativos</h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500">Fecha Tentativa</span>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                        {new Date(service.tentative_date).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Mostrar Precio solo si existe (Backend lo oculta si no es rol permitido) */}
                                {service.price !== undefined && service.price !== null && (
                                    <>
                                        <div className="border-t border-gray-200"></div>
                                        <div className="flex items-center justify-between p-2 -mx-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-100 p-1.5 rounded-lg">
                                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <span className="text-sm font-medium text-emerald-900">Tarifa</span>
                                            </div>
                                            <span className="text-lg font-bold text-emerald-700">
                                                {formatCurrency(service.price, service.currency_code)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-4">
                        {service.observations && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-amber-900 text-sm">Observaciones del Servicio</h3>
                                        <p className="text-sm text-amber-800 mt-1">{service.observations}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {service.operational_notes && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-blue-900 text-sm">Bitácora Operativa</h3>
                                        <p className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">{service.operational_notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}