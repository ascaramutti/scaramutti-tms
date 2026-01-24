import { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Ruler, Weight } from 'lucide-react';
import type { CargoType } from '../../interfaces/cargo.interface';
import { cargoService } from '../../services/cargo.service';

interface CargoSearchInputProps {
  selectedCargo: CargoType | null;
  onSelectCargo: (cargo: CargoType | null) => void;
  onCreateCargo: (searchTerm: string) => void;
  details: {
    weight: string;
    length: string;
    width: string;
    height: string;
  };
  onDetailChange: (name: string, value: string) => void;
}

export function CargoSearchInput({ 
    selectedCargo, 
    onSelectCargo, 
    onCreateCargo,
    details,
    onDetailChange
}: CargoSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CargoType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.length > 2) {
            setLoading(true);
            try {
                const cargos = await cargoService.searchCargoTypes(searchTerm); 
                setResults(cargos);
                setIsOpen(true);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else {
            setResults([]);
            if(searchTerm.length === 0) setIsOpen(false);
        }
    };
    
    const timerId = setTimeout(() => {
        search();
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handleSelect = (cargo: CargoType) => {
    onSelectCargo(cargo);
    
    if (cargo.standard_weight) onDetailChange('weight', cargo.standard_weight.toString());
    if (cargo.standard_length) onDetailChange('length', cargo.standard_length.toString());
    if (cargo.standard_width) onDetailChange('width', cargo.standard_width.toString());
    if (cargo.standard_height) onDetailChange('height', cargo.standard_height.toString());

    setSearchTerm('');
    setIsOpen(false);
  };

  const getInputClassName = () => {
    return "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white";
  };
  
  // Función auxiliar para formatear dimensiones dinámicamente
  const formatDimensions = (cargo: CargoType) => {
      const parts = [];
      if (cargo.standard_length) parts.push(`L${cargo.standard_length}m`);
      if (cargo.standard_width) parts.push(`A${cargo.standard_width}m`);
      if (cargo.standard_height) parts.push(`H${cargo.standard_height}m`);
      
      return parts.join(' x ');
  };

  if (selectedCargo) {
    return (
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-purple-100 p-2 rounded-full">
                <Package className="w-5 h-5 text-purple-600" />
             </div>
             <div>
                <p className="font-semibold text-gray-900">{selectedCargo.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{selectedCargo.description || 'Sin descripción'}</p>
             </div>
          </div>
          <button
            type="button"
            onClick={() => {
                onSelectCargo(null);
                setSearchTerm('');
            }}
            className="text-xs text-gray-600 hover:text-gray-900 underline mt-1"
          >
            Cambiar
          </button>
        </div>

        <div className="space-y-3 border-t border-purple-200 pt-4">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Dimensiones y Peso (Editable para este servicio)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Largo (m)</label>
                <input
                  type="number"
                  value={details.length}
                  onChange={(e) => onDetailChange('length', e.target.value)}
                  step="0.01" min="0" placeholder="0"
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ancho (m)</label>
                <input
                  type="number"
                  value={details.width}
                  onChange={(e) => onDetailChange('width', e.target.value)}
                  step="0.01" min="0" placeholder="0"
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Alto (m)</label>
                <input
                  type="number"
                  value={details.height}
                  onChange={(e) => onDetailChange('height', e.target.value)}
                  step="0.01" min="0" placeholder="0"
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Weight className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={details.weight}
                    onChange={(e) => onDetailChange('weight', e.target.value)}
                    step="0.1" min="0" placeholder="0.00"
                    className={`pl-8 ${getInputClassName()}`}
                  />
                </div>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Carga <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (!isOpen) setIsOpen(true);
            
            if (val.length > 2) {
                setLoading(true);
            } else {
                setLoading(false);
            }
          }}
          onFocus={() => {
              if (searchTerm.length > 0) setIsOpen(true);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Buscar tipo de carga..." 
        />
      </div>

      {isOpen && !selectedCargo && searchTerm.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
             <div className="px-4 py-3 text-sm text-gray-500 text-center bg-gray-50">Buscando...</div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((cargo) => (
                <button
                  key={cargo.id}
                  type="button"
                  onClick={() => handleSelect(cargo)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                >
                  <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{cargo.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{cargo.description}</p>
                    
                     {/* INFO DE DIMENSIONES (Dinámico) */}
                    {(cargo.standard_length || cargo.standard_width || cargo.standard_height || cargo.standard_weight) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {/* Solo llamar a la función si hay dimensiones */}
                            {formatDimensions(cargo) && (
                                <span className='flex items-center gap-1'>
                                    <Ruler className="w-3 h-3" />
                                    {formatDimensions(cargo)}
                                </span>
                            )}
                            
                            {cargo.standard_weight && (
                                <span className='flex items-center gap-1'>
                                    <Weight className="w-3 h-3" />
                                    {cargo.standard_weight} kg
                                </span>
                            )}
                        </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length > 2 ? (
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onCreateCargo(searchTerm);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 text-purple-600"
              >
                <div className="bg-purple-100 p-2 rounded-full">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Crear nuevo tipo de carga</p>
                  <p className="text-xs text-gray-600">No se encontraron resultados para "{searchTerm}"</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
               Ingrese al menos 3 caracteres...
            </div>
          )}
        </div>
      )}
    </div>
  );
}