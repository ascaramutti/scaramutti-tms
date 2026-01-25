import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, FileText, Calendar, Clock, User as UserIcon, Truck, Package, Ruler, MapPin, Weight } from 'lucide-react';
import { toast } from 'sonner';
import type { Service, ChangeStatusPayload } from '../../interfaces/services.interface';

interface FinishServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    onConfirm: (serviceId: number, data: ChangeStatusPayload) => Promise<void>;
}

export function FinishServiceModal({ isOpen, onClose, service, onConfirm }: FinishServiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [endDateTime, setEndDateTime] = useState('');
    const [notes, setNotes] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && service) {
            const now = new Date();
            const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                .toISOString()
                .slice(0, 16);
            setEndDateTime(localIsoString);
            setNotes('');
            setShowSuccess(false);
        }
    }, [isOpen, service]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service) return;

        if (!endDateTime) {
            toast.error('La fecha y hora de finalización son requeridas');
            return;
        }

        try {
            setLoading(true);
            await onConfirm(service.id, {
                status: 'completed',
                date: new Date(endDateTime).toISOString(),
                notes: notes
            });
            setShowSuccess(true);
            setTimeout(() => {
                onClose();
                setShowSuccess(false);
            }, 1500);
        } catch (error) {
            console.error('Error finishing service:', error);
            // Toast error handled by parent usually, or we can add here if needed.
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !service) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-200">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Servicio Finalizado!</h3>
                    <p className="text-gray-600">El servicio #{service.id} ha sido completado exitosamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full">
                            <CheckCircle className="w-6 h-6 text-emerald-600 ml-1" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Finalizar Servicio</h2>
                            <p className="text-sm text-gray-600">Servicio #{service.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Alertas: Observaciones y Notas Operativas */}
                    <div className="space-y-3">
                        {service.observations && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-amber-900 mb-1">Observaciones del Cliente</h3>
                                        <p className="text-sm text-amber-800">{service.observations}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {service.operational_notes && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-blue-900 mb-1">Bitácora Operativa</h3>
                                        <p className="text-sm text-blue-800 whitespace-pre-line">{service.operational_notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resumen Cliente y Ruta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cliente */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-200 p-1.5 rounded-full">
                                    <UserIcon className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</p>
                                    <p className="font-semibold text-gray-900 text-sm">{service.client_name}</p>
                                    <p className="text-xs text-gray-500">RUC: {service.client_ruc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Ruta */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-200 p-1.5 rounded-full">
                                    <MapPin className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ruta</p>
                                    <div className="flex items-center gap-1 text-sm text-gray-900 truncate">
                                        <span className="font-medium truncate">{service.origin}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-medium truncate">{service.destination}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Inicio Real: {service.start_date_time ? new Date(service.start_date_time).toLocaleDateString() + ' ' + new Date(service.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRID: Carga y Recursos (Lado a Lado, Misma Altura) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Carga Info */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5 text-purple-600" />
                                <p className="text-sm font-bold text-purple-900">Detalle de Carga</p>
                            </div>

                            <p className="text-sm text-purple-900 font-medium mb-3">{service.cargo_type_name}</p>

                            <div className="flex flex-wrap items-center gap-2">
                                {(service.length || service.width || service.height) && (
                                    <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded border border-purple-100 shadow-sm w-full md:w-auto">
                                        <Ruler className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-xs font-medium text-purple-700">
                                            {[
                                                service.length ? `L:${service.length}m` : null,
                                                service.width ? `A:${service.width}m` : null,
                                                service.height ? `H:${service.height}m` : null
                                            ].filter(Boolean).join(' x ')}
                                        </span>
                                    </div>
                                )}

                                {service.weight > 0 && (
                                    <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded border border-purple-100 shadow-sm w-full md:w-auto">
                                        <Weight className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-xs font-medium text-purple-700">
                                            {service.weight} kg
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recursos Asignados (Orange Theme) */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck className="w-5 h-5 text-orange-600" />
                                <p className="text-sm font-bold text-orange-900">Recursos Asignados</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-orange-600 uppercase mb-0.5">Conductor</p>
                                    <p className="text-sm font-bold text-gray-900">{service.driver_name || 'No asignado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-orange-600 uppercase mb-0.5">Unidad (Tracto / Trailer)</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {service.tractor_plate || '--'}
                                        {service.trailer_plate ? ` / ${service.trailer_plate}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2"></div>

                    {/* Inputs de Cierre (Fecha y Notas) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date/Time Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha y Hora de Finalización
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Hora oficial de cierre
                            </p>
                        </div>

                        {/* Notes Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas de Cierre (Opcional)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notas finales..."
                                    rows={1}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-[42px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info final */}
                    <div className="flex gap-3 bg-emerald-50 p-3 rounded-lg text-sm text-emerald-700">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p>El servicio pasará a estado <strong>COMPLETADO</strong> y los recursos serán liberados inmediatamente.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                            disabled={loading}
                        >
                            {loading ? 'Finalizando...' : 'Confirmar Cierre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
