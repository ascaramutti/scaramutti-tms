import { useState, useEffect } from 'react';
import { X, Edit, AlertCircle, Save, User, MapPin, Package, DollarSign, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { servicesService } from '../../services/services.service';
import { resourcesService } from '../../services/resources.service';
import { clientService } from '../../services/clients.service';
import { currenciesService } from '../../services/currencies.service';
import type { Service, UpdateServiceRequest } from '../../interfaces/services.interface';
import type { Driver, Tractor, Trailer } from '../../interfaces/resources.interface';
import type { Client } from '../../interfaces/clients.interface';
import type { Currency } from '../../interfaces/currencies.interface';

interface EditServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    onSuccess: () => void;
}

interface FormData {
    clientId: number;
    origin: string;
    destination: string;
    tentativeDate: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    observations: string;
    price: number;
    currencyId: number;
    driverId: number | null;
    tractorId: number | null;
    trailerId: number | null;
    startDateTime: string;
    endDateTime: string;
    operationalNotes: string;
}

export function EditServiceModal({ isOpen, onClose, service, onSuccess }: EditServiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [justification, setJustification] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tractors, setTractors] = useState<Tractor[]>([]);
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [priceDisplay, setPriceDisplay] = useState('0.00');

    const [formData, setFormData] = useState<FormData>({
        clientId: 0,
        origin: '',
        destination: '',
        tentativeDate: '',
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        observations: '',
        price: 0,
        currencyId: 1,
        driverId: null,
        tractorId: null,
        trailerId: null,
        startDateTime: '',
        endDateTime: '',
        operationalNotes: ''
    });

    const [originalData, setOriginalData] = useState<FormData | null>(null);

    useEffect(() => {
        if (isOpen && service) {
            loadResources();
            loadServiceData();
        } else {
            setJustification('');
            setHasChanges(false);
        }
    }, [isOpen, service]);

    const loadResources = async () => {
        try {
            const [clientsData, currenciesData, driversData, tractorsData, trailersData] = await Promise.all([
                clientService.getClients(),
                currenciesService.getCurrencies(),
                resourcesService.getDrivers(),
                resourcesService.getTractors(),
                resourcesService.getTrailers()
            ]);
            setClients(clientsData);
            setCurrencies(currenciesData);
            setDrivers(driversData);
            setTractors(tractorsData);
            setTrailers(trailersData);
        } catch (error) {
            console.error('Error loading resources:', error);
        }
    };

    const loadServiceData = () => {
        if (!service) return;

        const priceValue = Number(service.price);
        const data: FormData = {
            clientId: service.client_id,
            origin: service.origin,
            destination: service.destination,
            tentativeDate: service.tentative_date ? service.tentative_date.split('T')[0] : '',
            weight: Number(service.weight),
            length: Number(service.length || 0),
            width: Number(service.width || 0),
            height: Number(service.height || 0),
            observations: service.observations || '',
            price: priceValue,
            currencyId: service.currency_id,
            driverId: service.driver_id || null,
            tractorId: service.tractor_id || null,
            trailerId: service.trailer_id || null,
            startDateTime: service.start_date_time ? service.start_date_time.split('.')[0] : '',
            endDateTime: service.end_date_time ? service.end_date_time.split('.')[0] : '',
            operationalNotes: service.operational_notes || ''
        };

        setPriceDisplay(priceValue.toFixed(2));
        setFormData(data);
        setOriginalData(data);
    };

    useEffect(() => {
        if (!originalData) return;

        const changed = Object.keys(formData).some(key => {
            const k = key as keyof FormData;
            const current = formData[k];
            const original = originalData[k];

            if (typeof current === 'number' && typeof original === 'number') {
                return Number(current) !== Number(original);
            }

            if (current == null || original == null) {
                return current !== original;
            }

            return String(current).trim() !== String(original).trim();
        });

        setHasChanges(changed);
    }, [formData, originalData]);

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!service) return;

        if (!justification.trim() || justification.trim().length < 10) {
            toast.error('La justificación debe tener al menos 10 caracteres');
            return;
        }

        if (!hasChanges) {
            toast.error('No se detectaron cambios en el servicio');
            return;
        }

        try {
            setLoading(true);

            const payload: UpdateServiceRequest = {
                description: justification
            };

            Object.keys(formData).forEach(key => {
                const k = key as keyof FormData;
                if (formData[k] !== originalData?.[k]) {
                    const fieldMap: Record<string, string> = {
                        clientId: 'clientId',
                        tentativeDate: 'tentativeDate',
                        currencyId: 'currencyId',
                        driverId: 'driverId',
                        tractorId: 'tractorId',
                        trailerId: 'trailerId',
                        startDateTime: 'startDateTime',
                        endDateTime: 'endDateTime',
                        operationalNotes: 'operationalNotes'
                    };

                    const backendField = fieldMap[k] || k;
                    (payload as any)[backendField] = formData[k];
                }
            });

            await servicesService.updateService(service.id, payload);
            toast.success('Servicio actualizado correctamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Update service error:', error);
            const message = error.response?.data?.message || 'Error al actualizar el servicio';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !service) return null;

    const status = service.status_name;
    const showAssignmentFields = ['pending_start', 'in_progress', 'completed', 'cancelled'].includes(status);
    const showStartDate = ['in_progress', 'completed', 'cancelled'].includes(status);
    const showEndDate = ['completed', 'cancelled'].includes(status);

    const getStatusColor = (status: string) => {
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
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 z-10 text-white ${getStatusColor(status)}`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Edit className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Editar Servicio #{service.id}</h2>
                            <p className="text-white/90 text-sm font-medium">{getStatusName(status)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Alerta de cambios */}
                    {hasChanges && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900">
                                    <strong>Cambios detectados.</strong> Complete la justificación para guardar.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cliente */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-bold text-blue-900">Cliente</p>
                        </div>
                        <select
                            value={formData.clientId}
                            onChange={(e) => handleInputChange('clientId', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Seleccionar cliente</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.ruc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ruta */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <p className="text-sm font-bold text-orange-900">Ruta y Fecha</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Origen <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.origin}
                                    onChange={(e) => handleInputChange('origin', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Destino <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.destination}
                                    onChange={(e) => handleInputChange('destination', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Fecha Tentativa
                                </label>
                                <input
                                    type="date"
                                    value={formData.tentativeDate}
                                    onChange={(e) => handleInputChange('tentativeDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Carga y Precio (Grid 2 columnas) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Carga */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5 text-purple-600" />
                                <p className="text-sm font-bold text-purple-900">Detalle de Carga</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-purple-600 uppercase mb-1">
                                        Peso (kg) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.weight}
                                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-purple-600 uppercase mb-1">Largo (m)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.length}
                                            onChange={(e) => handleInputChange('length', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-purple-600 uppercase mb-1">Ancho (m)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.width}
                                            onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-purple-600 uppercase mb-1">Alto (m)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.height}
                                            onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Precio */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-bold text-green-900">Acuerdo Económico</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-green-600 uppercase mb-1">
                                        Monto <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={priceDisplay}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            setPriceDisplay(value);
                                            const numValue = parseFloat(value) || 0;
                                            handleInputChange('price', numValue);
                                        }}
                                        onBlur={() => {
                                            const numValue = parseFloat(priceDisplay) || 0;
                                            const formatted = numValue.toFixed(2);
                                            setPriceDisplay(formatted);
                                            handleInputChange('price', numValue);
                                        }}
                                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-green-600 uppercase mb-1">
                                        Moneda <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.currencyId}
                                        onChange={(e) => handleInputChange('currencyId', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    >
                                        {currencies.map(currency => (
                                            <option key={currency.id} value={currency.id}>
                                                {currency.code} - {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Observaciones</label>
                        <textarea
                            value={formData.observations}
                            onChange={(e) => handleInputChange('observations', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Notas adicionales sobre la carga..."
                        />
                    </div>

                    {/* Recursos Asignados (solo si aplica según estado) */}
                    {showAssignmentFields && (
                        <>
                            <div className="border-t border-gray-200 pt-2"></div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Truck className="w-5 h-5 text-orange-600" />
                                    <p className="text-sm font-bold text-orange-900">Recursos Asignados</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-orange-600 uppercase mb-1">Conductor</label>
                                        <select
                                            value={formData.driverId || ''}
                                            onChange={(e) => handleInputChange('driverId', e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="">Sin asignar</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-orange-600 uppercase mb-1">Tracto</label>
                                        <select
                                            value={formData.tractorId || ''}
                                            onChange={(e) => handleInputChange('tractorId', e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="">Sin asignar</option>
                                            {tractors.map(t => (
                                                <option key={t.id} value={t.id}>{t.plate}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-orange-600 uppercase mb-1">Trailer</label>
                                        <select
                                            value={formData.trailerId || ''}
                                            onChange={(e) => handleInputChange('trailerId', e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="">Sin asignar</option>
                                            {trailers.map(t => (
                                                <option key={t.id} value={t.id}>{t.plate}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notas Operacionales */}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-orange-600 uppercase mb-1">Notas Operacionales</label>
                                    <textarea
                                        value={formData.operationalNotes}
                                        onChange={(e) => handleInputChange('operationalNotes', e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Notas internas del servicio..."
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Fechas de Ejecución (solo si aplica según estado) */}
                    {(showStartDate || showEndDate) && (
                        <>
                            <div className="border-t border-gray-200 pt-2"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {showStartDate && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Fecha/Hora de Inicio
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startDateTime}
                                            onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                                {showEndDate && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Fecha/Hora de Fin
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endDateTime}
                                            onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Justificación (obligatoria) */}
                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Justificación de los Cambios <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows={3}
                            placeholder="Describa la razón de los cambios (mínimo 10 caracteres)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {justification.length}/10 caracteres mínimos
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!hasChanges || loading || justification.trim().length < 10}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
