import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, ArrowLeft, MapPin, Package, FileText, Save, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import { ClientSearchInput } from '../../components/services/ClientSearchInput';
import { CreateClientModal } from '../../components/services/CreateClientModal';
import { CargoSearchInput } from '../../components/services/CargoSearchInput';
import { CreateCargoModal } from '../../components/services/CreateCargoModal';

import { servicesService } from '../../services/services.service';
import { serviceTypesService } from '../../services/service-types.service';
import { currenciesService } from '../../services/currencies.service'; 

import type { Client } from '../../interfaces/clients.interface';
import type { CargoType } from '../../interfaces/cargo.interface';
import type { ServiceType } from '../../interfaces/service-types.interface';
import type { Currency } from '../../interfaces/currencies.interface'; 

export default function CreateServicePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]); 
 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [newCargoName, setNewCargoName] = useState('');

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    serviceTypeId: '', 
    date: new Date().toISOString().split('T')[0],
    price: '',
    currencyId: '',
    notes: '',
    
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<CargoType | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [types, currenciesData] = await Promise.all([
        serviceTypesService.getServiceTypes(),
        currenciesService.getCurrencies()
      ]);

      setServiceTypes(types);
      setCurrencies(currenciesData);

      setFormData(prev => ({
        ...prev,
        serviceTypeId: types.length > 0 ? types[0].id.toString() : '',
        currencyId: (currenciesData.find(c => c.code === 'PEN') || currenciesData[0])?.id.toString() || ''
      }));

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos iniciales');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCargoDetailsChange = (details: { length: number; width: number; height: number; weight: number }) => {
    setFormData(prev => ({
        ...prev,
        length: details.length ? details.length.toString() : '',
        width: details.width ? details.width.toString() : '',
        height: details.height ? details.height.toString() : '',
        weight: details.weight ? details.weight.toString() : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightVal = parseFloat(formData.weight);
    const priceVal = parseFloat(formData.price);
    
    if (!selectedClient || !selectedCargo || !formData.origin || !formData.destination || !formData.serviceTypeId || !formData.currencyId || !formData.weight || isNaN(priceVal) || priceVal <= 0 || isNaN(weightVal) || weightVal <= 0) {
      toast.error('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      setLoading(true);
      
      await servicesService.createService({
        clientId: selectedClient.id,
        cargoTypeId: selectedCargo.id,
        serviceTypeId: parseInt(formData.serviceTypeId),
        origin: formData.origin,
        destination: formData.destination,
        tentativeDate: formData.date,
        price: parseFloat(formData.price),
        currencyId: parseInt(formData.currencyId),
        observations: formData.notes,
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || undefined,
        width: parseFloat(formData.width) || undefined,
        height: parseFloat(formData.height) || undefined,
      });

      toast.success('Servicio creado exitosamente');
      navigate('/dashboard'); 
    } catch (error: any) {
      console.error('Error creating service:', error);
      if(error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error(`Error al crear el servicio`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string = '') => {
    const roles: any = {
      admin: 'Administrador',
      dispatcher: 'Despachador',
      driver: 'Conductor',
    };
    return roles[role] || role;
  };

  const inputClassName = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors";

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
                type="button"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Servicio</h1>
                <p className="text-sm text-gray-600 mt-1">Complete la información del servicio</p>
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
                type="button"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Sección 1: Cliente */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-600" />
                Información del Cliente
              </h2>
              <ClientSearchInput
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
                onCreateClient={(name) => {
                  setNewClientName(name);
                  setIsClientModalOpen(true);
                }}
              />
            </div>

            {/* Sección 2: Detalles del Servicio */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Detalles del Servicio
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Servicio <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serviceTypeId"
                    value={formData.serviceTypeId}
                    onChange={handleChange}
                    className={inputClassName}
                  >
                    {serviceTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Tentativa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="Ej: Av. Principal 123, Ciudad"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="Ej: Calle Secundaria 456, Suburbio"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Carga */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Información de Carga
              </h2>
              
              <div className="mb-4">
                  <CargoSearchInput
                    selectedCargo={selectedCargo}
                    onSelectCargo={setSelectedCargo}
                    onCreateCargo={(name) => {
                      setNewCargoName(name);
                      setIsCargoModalOpen(true);
                    }}
                    // NUEVOS PROPS
                    details={{
                        weight: formData.weight,
                        length: formData.length,
                        width: formData.width,
                        height: formData.height
                    }}
                    onDetailChange={(name, value) => {
                        setFormData(prev => ({ ...prev, [name]: value }));
                    }}
                  />
              </div>
              
              {/* ¡HEMOS BORRADO TODO EL DIV QUE CONTENÍA LOS INPUTS DE PESO, LARGO, ANCHO, ALTO! */}
            </div>

            {/* Sección 4: Precio */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Información de Precio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currencyId"
                    value={formData.currencyId}
                    onChange={handleChange}
                    className={inputClassName}
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

            {/* Sección 5: Notas */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Notas Adicionales
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ingrese cualquier observación o instrucción especial..."
                  className={`resize-none ${inputClassName}`}
                />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Guardando...' : 'Crear Servicio'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </main>

      {/* Modals */}
      <CreateClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        initialName={newClientName}
        onClientCreated={(client) => {
            setSelectedClient(client);
            setIsClientModalOpen(false);
        }}
      />

      <CreateCargoModal
        isOpen={isCargoModalOpen}
        onClose={() => setIsCargoModalOpen(false)}
        initialName={newCargoName}
        onCargoCreated={(cargo) => {
            setSelectedCargo(cargo);
            handleCargoDetailsChange({
                length: cargo.standard_length || 0,
                width: cargo.standard_width || 0,
                height: cargo.standard_height || 0,
                weight: cargo.standard_weight || 0
            });
            setIsCargoModalOpen(false);
        }}
      />
    </div>
  );
}