-- SEED_DB.SQL
-- Script para poblar la base de datos con Dummies y Datos Maestros

-- 1. ROLES (Actualizados a requerimiento)
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrador del sistema'),
('sales', 'Encargado de Ventas'),
('dispatcher', 'Coordinador de Operaciones'),
('general_manager', 'Gerente General'),
('operations_manager', 'Gerente de Operaciones');

-- 2. MONEDAS
INSERT INTO currencies (code, symbol, name) VALUES 
('USD', '$', 'Dólar Estadounidense'),
('PEN', 'S/', 'Sol Peruano');

-- 3. ESTADOS DE SERVICIO
INSERT INTO service_statuses (name, description) VALUES 
('pending_assignment', 'Creado pero sin recursos asignados'),
('pending_start', 'Asignado, esperando confirmación de inicio'),
('in_progress', 'En ruta / ejecución'),
('completed', 'Servicio finalizado correctamente'),
('cancelled', 'Servicio anulado');

-- 4. ESTADOS DE RECURSOS
INSERT INTO resource_statuses (name, description) VALUES 
('available', 'Listo para ser asignado'),
('maintenance', 'En taller o revisión'),
('on_route', 'Actualmente en un servicio'),
('assigned', 'Reservado para un servicio próximo'),
('not_available', 'Baja temporal o descanso');

-- 5. WORKERS (Staff Completo)
INSERT INTO workers (first_name, last_name, dni, position) VALUES 
('Angel', 'Scaramutti', '00000001', 'Gerente General'), -- ID 1
('Maria', 'Ventas', '10101010', 'Ejecutiva de Ventas'), -- ID 2
('Juan', 'Dispatcher', '20202020', 'Coordinador de Flota'), -- ID 3
('Pedro', 'Operaciones', '30303030', 'Gerente de Operaciones'), -- ID 4
('Carlos', 'Sistemas', '40404040', 'Administrador IT'), -- ID 5
('Luis', 'Chofer A', '50505050', 'Conductor'), -- ID 6
('Jose', 'Chofer B', '60606060', 'Conductor'), -- ID 7
('Miguel', 'Chofer C', '70707070', 'Conductor'); -- ID 8

-- 6. USERS (Usuarios del Sistema - Roles asignados)
-- Password '123456' hasheado: $2b$10$3euPcmQFCib0Yf/u.wndu.g5qQYd7j54c4e9.18Yw1.1
INSERT INTO users (worker_id, username, password_hash, role_id) VALUES 
(1, 'ascaramutti', '$2b$10$e4GfzT1LpBeaxAeueAJzdeMuvwNfx.vhXeKR7G.lcuNrCV/ZzdWXq', 4), -- GM
(2, 'mventas', '$2b$10$e4GfzT1LpBeaxAeueAJzdeMuvwNfx.vhXeKR7G.lcuNrCV/ZzdWXq', 2), -- Sales
(3, 'jdispatcher', '$2b$10$e4GfzT1LpBeaxAeueAJzdeMuvwNfx.vhXeKR7G.lcuNrCV/ZzdWXq', 3), -- Dispatcher
(4, 'poperaciones', '$2b$10$e4GfzT1LpBeaxAeueAJzdeMuvwNfx.vhXeKR7G.lcuNrCV/ZzdWXq', 5), -- Ops Manager
(5, 'admin', '$2b$10$e4GfzT1LpBeaxAeueAJzdeMuvwNfx.vhXeKR7G.lcuNrCV/ZzdWXq', 1); -- Admin

-- 7. CLIENTS
INSERT INTO clients (name, ruc, contact_name, phone) VALUES 
('ALICORP SAA', '20100055237', 'Maria Gomez', '999888777'),
('SIDERPERU', '20100035041', 'Roberto Manrique', '988555222'),
('ACEROS AREQUIPA', '20345678901', 'Logistica Recepcion', '912345678'),
('GLORIA SA', '20100190797', 'Fernando Torres', '955444333'),
('CEMENTOS PACASMAYO', '20419387658', 'Lucia Fernandez', '966777888');

-- 8. RECURSOS FISICOS

-- Drivers (Sin usuario de sistema, solo workers con licencia)
INSERT INTO drivers (worker_id, license_number, category, status_id) VALUES 
(6, 'Q50505050', 'AIIIC', 1), -- Avail
(7, 'Q60606060', 'AIIIC', 1), -- Avail
(8, 'Q70707070', 'AIIIC', 1); -- Avail

-- Tractors
INSERT INTO tractors (plate, brand, model, year, status_id) VALUES 
('TRC001', 'Volvo', 'FH16', 2022, 1),
('TRC002', 'Scania', 'R500', 2021, 1),
('TRC003', 'Mercedes', 'Actros', 2023, 1),
('TRC004', 'Volvo', 'FMX', 2020, 2); -- Mantenimiento

-- Trailers
INSERT INTO trailers (plate, type, status_id) VALUES 
('CRL001', 'Plataforma', 1),
('CRL002', 'Cama Baja', 1),
('CRL003', 'Plataforma', 1),
('CRL004', 'Camabaja', 1);

-- 9. CARGO TYPES
INSERT INTO cargo_types (name, description, standard_weight, standard_length) VALUES 
('CONTENEDOR 40FT', 'Contenedor estándar', 30000.00, 12.00),
('BOBINAS DE ACERO', 'Transporte especial pesado', 32000.00, 6.00),
('CARGA GENERAL', 'Pallets diversos', 25000.00, 13.50),
('MAQUINARIA PESADA', 'Cama baja requerida', 45000.00, 10.00),
('CEMENTO A GRANEL', 'Tolvas', 35000.00, 8.00);

-- 10. SERVICES (10 Servicios de prueba)
INSERT INTO services (
    client_id, origin, destination, tentative_date, 
    cargo_type_id, weight, observations, 
    price, currency_id, status_id, created_by
) VALUES 
-- 1. Pendiente (Nuevo)
(1, 'Callao, Lima', 'Arequipa, Centro', '2026-02-15', 1, 28000.00, 'Entregar antes del mediodía', 1500.00, 1, 1, 2),
-- 2. Pendiente (Nuevo)
(3, 'Pisco', 'Lima', '2026-02-16', 2, 32000.00, 'Cuidado con lluvia', 4500.00, 2, 1, 2),
-- 3. Asignado (Listo para iniciar)
(2, 'Chimbote', 'Trujillo', '2026-02-10', 3, 25000.00, 'Fragil', 1200.00, 1, 2, 3),
-- 4. En Progreso
(4, 'Lima', 'Cajamarca', '2026-02-08', 1, 30000.00, 'Salida nocturna', 2000.00, 1, 3, 3),
-- 5. Completado
(5, 'Pacasmayo', 'Chiclayo', '2026-01-20', 5, 35000.00, 'Todo OK', 800.00, 1, 4, 3),
-- 6. Cancelado
(1, 'Callao', 'Huancayo', '2026-02-20', 1, 28000.00, 'Cancelado por cliente', 1800.00, 1, 5, 2),
-- 7. Pendiente (Urgente)
(2, 'Lima', 'Ica', '2026-02-12', 2, 31000.00, 'URGENTE', 900.00, 1, 1, 2),
-- 8. En Progreso
(3, 'Arequipa', 'Cusco', '2026-02-05', 2, 32000.00, 'Ruta con curvas', 3500.00, 1, 3, 3),
-- 9. Completado
(4, 'Lima', 'Piura', '2026-01-15', 3, 15000.00, 'Carga ligera', 2200.00, 1, 4, 3),
-- 10. Pendiente Asignacion
(5, 'Tarapoto', 'Moyobamba', '2026-03-01', 5, 34000.00, 'Acceso dificil', 3000.00, 2, 1, 2);

-- Asignaciones manuales para los que no están 'pending_assignment'
-- Service 3 (Asignado)
UPDATE services SET driver_id = 1, tractor_id = 1, trailer_id = 1 WHERE id = 3;
-- Service 4 (In Progress)
UPDATE services SET driver_id = 2, tractor_id = 2, trailer_id = 2 WHERE id = 4;
-- Service 5 (Completed)
UPDATE services SET driver_id = 3, tractor_id = 3, trailer_id = 3 WHERE id = 5;
-- Service 8 (In Progress)
UPDATE services SET driver_id = 1, tractor_id = 1, trailer_id = 1 WHERE id = 8;
-- Service 9 (Completed)
UPDATE services SET driver_id = 2, tractor_id = 2, trailer_id = 2 WHERE id = 9;
