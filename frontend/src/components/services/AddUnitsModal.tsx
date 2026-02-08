import { useState, useEffect } from 'react';
import { X, Truck, User, FileText, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { resourcesService } from '../../services/resources.service';
import { servicesService } from '../../services/services.service';
import type { Driver, Tractor, Trailer } from '../../interfaces/resources.interface';
import type { Service, AddServiceAssignmentPayload } from '../../interfaces/services.interface';

interface AddUnitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    onSuccess: () => void;
}

export function AddUnitsModal({ isOpen, onClose, service, onSuccess }: AddUnitsModalProps) {
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tractors, setTractors] = useState<Tractor[]>([]);
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [conflictMessage, setConflictMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        truckId: '',
        trailerId: '',
        driverId: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadResources();
            setConflictMessage(null);
        } else {
            setFormData({ truckId: '', trailerId: '', driverId: '', notes: '' });
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

    const validateForm = (): boolean => {
        // Validación 1: Al menos un recurso debe estar seleccionado
        if (!formData.truckId && !formData.trailerId && !formData.driverId) {
            toast.error('Debe seleccionar al menos un recurso (tracto, trailer o conductor)');
            return false;
        }

        // Validación 2: Notes obligatorio con mínimo 10 caracteres
        if (!formData.notes.trim()) {
            toast.error('El campo "Motivo" es obligatorio');
            return false;
        }

        if (formData.notes.trim().length < 10) {
            toast.error('El motivo debe tener al menos 10 caracteres');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent, force: boolean = false) => {
        if (e) e.preventDefault();

        if (!service) return;

        // Solo validar si no es force (cuando es force, ya pasó las validaciones)
        if (!force && !validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setConflictMessage(null);

            const payload: AddServiceAssignmentPayload = {
                notes: formData.notes.trim(),
                force: force
            };

            // Solo incluir las unidades que fueron seleccionadas
            if (formData.truckId) {
                payload.truckId = Number(formData.truckId);
            }
            if (formData.trailerId) {
                payload.trailerId = Number(formData.trailerId);
            }
            if (formData.driverId) {
                payload.driverId = Number(formData.driverId);
            }

            await servicesService.addServiceAssignment(service.id, payload);
            toast.success('Recursos adicionales agregados exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Add units error:', error);
            if (error.response && error.response.status === 409) {
                // Conflicto: mostrar advertencia
                setConflictMessage(error.response.data.message);
            } else if (error.response && error.response.status === 400) {
                // Error de validación del backend
                toast.error(error.response.data.message || 'Error de validación');
            } else {
                toast.error('No se pudieron agregar las unidades. Intente nuevamente.');
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
                        <div className="bg-green-100 p-2 rounded-full">
                            <Plus className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Agregar Recursos Adicionales</h2>
                            <p className="text-sm text-gray-600">Servicio #{service.id} - {service.client_name}</p>
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

                    {/* Info: Al menos un recurso */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Nota:</strong> Debe seleccionar al menos un recurso (tracto, trailer o conductor) para agregar al servicio.
                        </p>
                    </div>

                    {/* Tracto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tracto <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.truckId}
                                onChange={(e) => setFormData(prev => ({ ...prev, truckId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                disabled={loading}
                            >
                                <option value="">Sin tracto adicional</option>
                                {tractors.map(tractor => (
                                    <option key={tractor.id} value={tractor.id}>{tractor.plate} - {tractor.model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Trailer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trailer <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.trailerId}
                                onChange={(e) => setFormData(prev => ({ ...prev, trailerId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                disabled={loading}
                            >
                                <option value="">Sin trailer adicional</option>
                                {trailers.map(trailer => (
                                    <option key={trailer.id} value={trailer.id}>{trailer.plate} - {trailer.type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Conductor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Conductor <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.driverId}
                                onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                disabled={loading}
                            >
                                <option value="">Sin conductor adicional</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Motivo (Notes) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo de la Asignación <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Motivo de la asignación adicional (mínimo 10 caracteres)..."
                                rows={4}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                disabled={loading}
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Ejemplo: "Cambio de tracto por falla mecánica", "Relevo de conductor", etc.
                        </p>
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
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                                disabled={loading}
                            >
                                <Plus className="w-4 h-4" />
                                {loading ? 'Agregando...' : 'Agregar Recursos'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
