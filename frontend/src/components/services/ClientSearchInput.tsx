import { useState, useEffect, useRef } from 'react';
import { Search, UserCircle, Plus, Phone, FileText } from 'lucide-react';
import type { Client } from '../../interfaces/clients.interface';
import { clientService } from '../../services/clients.service';

interface ClientSearchInputProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onCreateClient: (searchTerm: string) => void;
}

export function ClientSearchInput({ selectedClient, onSelectClient, onCreateClient }: ClientSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
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
    if (selectedClient && !isOpen) {
      setSearchTerm(selectedClient.name);
    }
  }, [selectedClient, isOpen]);

  useEffect(() => {
    const search = async () => {
      if (selectedClient?.name === searchTerm) return;

      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          const clients = await clientService.searchClients(searchTerm);
          setResults(clients);
          setIsOpen(true);
        } catch (error) {
          console.error("Error searching clients", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        if (searchTerm.length === 0 && !selectedClient) setIsOpen(false);
      }
    };

    const timerId = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm, selectedClient]);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setSearchTerm(client.name);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onSelectClient(null);
    setSearchTerm('');
    setIsOpen(true);
  };

  const handleCreateNew = () => {
    onCreateClient(searchTerm);
    setIsOpen(false);
  };
  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cliente <span className="text-red-500">*</span>
      </label>

      {selectedClient ? (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedClient.name}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  RUC: {selectedClient.ruc}
                </span>
                {selectedClient.phone && (
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedClient.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-gray-600 hover:text-blue-700 hover:underline mt-1"
          >
            Cambiar
          </button>
        </div>
      ) : (
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar por nombre o RUC..."
          />
        </div>
      )}

      {isOpen && !selectedClient && searchTerm.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">Buscando...</div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <UserCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        RUC: {client.ruc}
                      </span>
                      {client.phone && (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length > 2 ? (
            <div className="py-1">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 text-blue-600"
              >
                <div className="bg-blue-100 p-2 rounded-full">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Crear nuevo cliente</p>
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