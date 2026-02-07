import { useState, useEffect } from 'react';
import { X, Truck, User, FileText, AlertCircle, Package, Ruler, Weight, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { resourcesService } from '../../services/resources.service';
import type { Driver, Tractor, Trailer } from '../../interfaces/resources.interface';
import type { Service, AssignResourcesPayload } from '../../interfaces/services.interface';

interface AssignResourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    onAssign: (serviceId: number, data: AssignResourcesPayload) => Promise<void>;
}

export function AssignResourcesModal({ isOpen, onClose, service, onAssign }: AssignResourcesModalProps) {
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tractors, setTractors] = useState<Tractor[]>([]);
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [conflictMessage, setConflictMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        driverId: '',
        tractorId: '',
        trailerId: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadResources();
            setConflictMessage(null);
        } else {
            setFormData({ driverId: '', tractorId: '', trailerId: '', notes: '' });
            setConflictMessage(null);
        }
    }, [isOpen]);

    const loadResources = async () => {
        try {
            const [driversData, tractorsData, trailersData] = await Promise.all([
                resourcesService.getDrivers(),
                resourcesService.getTractors(),
                resourcesService.getTrailers()
            ]);
            setDrivers(driversData);
            setTractors(tractorsData);
            setTrailers(trailersData);
        } catch (error) {
            console.error('Error loading resources:', error);
            toast.error('Error al cargar listas de recursos');
        }
    };

    const handleSubmit = async (e: React.FormEvent, force: boolean = false) => {
        if (e) e.preventDefault();

        if (!service) return;
        if (!formData.driverId || !formData.tractorId) {
            toast.error('Complete todos los campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            setConflictMessage(null);

            const payload: AssignResourcesPayload = {
                driverId: Number(formData.driverId),
                tractorId: Number(formData.tractorId),
                notes: formData.notes,
                force: force
            };

            // Solo incluir trailerId si se seleccionó uno
            if (formData.trailerId) {
                payload.trailerId = Number(formData.trailerId);
            }

            await onAssign(service.id, payload);
            onClose();
        } catch (error: any) {
            console.error('Assignment error:', error);
            if (error.response && error.response.status === 409) {
                setConflictMessage(error.response.data.message);
            } else {
                toast.error('No se pudieron asignar los recursos. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !service) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <Truck className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Asignar Recursos</h2>
                            <p className="text-sm text-gray-600">Servicio #{service.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-6">

                    {/* ALERTA DE CONFLICTO */}
                    {conflictMessage && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fadeIn">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900 text-sm">Conflictos Detectados</h3>
                                    <div className="text-sm text-red-800 mt-1 whitespace-pre-line font-medium">
                                        {conflictMessage}
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setConflictMessage(null)}
                                            className="text-xs text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md font-medium transition"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e as any, true)}
                                            className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md font-bold transition shadow-sm"
                                        >
                                            FORZAR ASIGNACIÓN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Observaciones del Servicio */}
                    {service.observations && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-900 mb-1">Observaciones del Servicio</h3>
                                    <p className="text-sm text-amber-800">{service.observations}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resumen Cliente y Ruta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cliente */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-100 p-1.5 rounded-full">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Cliente</p>
                                    <p className="font-semibold text-blue-900 text-sm">{service.client_name}</p>
                                    <p className="text-xs text-blue-700">RUC: {service.client_ruc}</p>
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
                                        Fecha: {new Date(service.tentative_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carga Info */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-900">Carga: {service.cargo_type_name}</p>
                        </div>

                        {/* Dimensiones y Peso con Iconos */}
                        <div className="flex flex-wrap items-center gap-3">
                            {(service.length || service.width || service.height) && (
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-purple-100 shadow-sm">
                                    <Ruler className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-700">
                                        {[
                                            service.length ? `L${service.length}m` : null,
                                            service.width ? `A${service.width}m` : null,
                                            service.height ? `H${service.height}m` : null
                                        ].filter(Boolean).join(' x ')}
                                    </span>
                                </div>
                            )}

                            {service.weight > 0 && (
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-purple-100 shadow-sm">
                                    <Weight className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-700">
                                        {service.weight} kg
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conductor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Conductor <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.driverId}
                                onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                                disabled={loading}
                            >
                                <option value="">Seleccione un conductor</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tracto y Trailer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tracto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={formData.tractorId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tractorId: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                                    disabled={loading}
                                >
                                    <option value="">Seleccione un tracto</option>
                                    {tractors.map(tractor => (
                                        <option key={tractor.id} value={tractor.id}>{tractor.plate} - {tractor.model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trailer <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                            </label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={formData.trailerId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, trailerId: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                                    disabled={loading}
                                >
                                    <option value="">Sin trailer</option>
                                    {trailers.map(trailer => (
                                        <option key={trailer.id} value={trailer.id}>{trailer.plate} - {trailer.type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notas de Asignación</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Notas internas sobre la asignación..."
                                rows={3}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                                disabled={loading}
                            />
                        </div>
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
                        {!conflictMessage && (
                            <button
                                type="submit"
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? 'Asignando...' : 'Confirmar Asignación'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}