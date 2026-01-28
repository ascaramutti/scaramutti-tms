import { useState, useEffect } from 'react';
import { X, Package, Ruler, Weight } from 'lucide-react';
import type { CargoType } from '../../interfaces/cargo.interface';
import { cargoService } from '../../services/cargo.service';
import { toast } from 'sonner';

interface CreateCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCargoCreated: (cargo: CargoType) => void;
  initialName?: string;
}

export function CreateCargoModal({ isOpen, onClose, onCargoCreated, initialName = '' }: CreateCargoModalProps) {
  const [formData, setFormData] = useState({
    name: initialName,
    description: '',
    standardLength: '',
    standardWidth: '',
    standardHeight: '',
    standardWeight: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialName) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  }, [initialName]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightVal = parseFloat(formData.standardWeight);
    if (!formData.name || isNaN(weightVal) || weightVal <= 0) {
      toast.error('Nombre y peso estándar son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const newCargo = await cargoService.createCargoType({
        name: formData.name,
        description: formData.description,
        standard_length: formData.standardLength ? parseFloat(formData.standardLength) : undefined,
        standard_width: formData.standardWidth ? parseFloat(formData.standardWidth) : undefined,
        standard_height: formData.standardHeight ? parseFloat(formData.standardHeight) : undefined,
        standard_weight: parseFloat(formData.standardWeight),
      });
      onCargoCreated(newCargo);
      toast.success('Tipo de carga creado exitosamente');

      // Reset
      setFormData({
        name: '', description: '',
        standardLength: '', standardWidth: '', standardHeight: '', standardWeight: ''
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
        toast.error('Ya existe un tipo de carga con ese nombre');
      } else {
        toast.error('Error al crear tipo de carga');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Tipo de Carga</h2>
              <p className="text-sm text-gray-600">Registrar carga estándar en el sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informacion General */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" /> Información General
            </h3>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Tipo de Carga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Pallet Europeo, Bobina Grande..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción detallada o notas sobre este tipo de carga..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Dimensiones */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Dimensiones Estándar
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Largo (m)</label>
                <input
                  type="number" step="0.01" min="0"
                  name="standardLength" value={formData.standardLength} onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ancho (m)</label>
                <input
                  type="number" step="0.01" min="0"
                  name="standardWidth" value={formData.standardWidth} onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alto (m)</label>
                <input
                  type="number" step="0.01" min="0"
                  name="standardHeight" value={formData.standardHeight} onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Peso */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Weight className="w-4 h-4" /> Peso Estándar
            </h3>
            <div>
              <label htmlFor="standardWeight" className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number" step="0.1" min="0"
                  id="standardWeight"
                  name="standardWeight" value={formData.standardWeight} onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tipo de Carga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}