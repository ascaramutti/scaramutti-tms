import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export function DashboardPage () {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.name}</h1>
                        <p className="text-gray-500">Rol: {user?.role}</p>
                    </div>
                    <button 
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </header>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-blue-800">🎉 ¡Login Exitoso!</h2>
                    <p className="text-gray-600">
                        Si ves esto, todo el flujo de autenticación (Frontend - API - Base de Datos) está funcionando correctamente.
                    </p>
                </div>
            </div>
        </div>
    );
}