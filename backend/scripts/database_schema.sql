-- Database Schema for Transportes Scaramutti TMS (Final v5 - Estructura Dinámica y Normalizada)
-- Compatible with PostgreSQL

-- 1. TABLAS MAESTRAS (Configuración Global)

-- Roles de Usuario
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'Admin', 'Dispatcher', 'Driver', etc.
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Monedas
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code CHAR(3) UNIQUE NOT NULL, -- 'USD', 'PEN'
    symbol VARCHAR(5),
    name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Estados de Servicio (Dinámico)
-- Se poblará con: 'Pending Assignment', 'Pending Start', 'In Progress', 'Completed', 'Cancelled'
CREATE TABLE service_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Estados de Recursos (Dinámico)
-- Se poblará con: 'Available', 'Maintenance', 'On Route', 'Assigned', 'Not Available'
CREATE TABLE resource_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. WORKERS (Recursos Humanos)
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(8) UNIQUE NOT NULL,
    phone VARCHAR(9),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS (Acceso al Sistema)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    worker_id INT UNIQUE REFERENCES workers(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLIENTS (Clientes)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    phone VARCHAR(9),
    contact_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. RECURSOS (Drivers, Tractos, Carretas)

-- Drivers
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    worker_id INT UNIQUE REFERENCES workers(id),
    license_number VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(20),
    -- Estado normalizado
    status_id INT REFERENCES resource_statuses(id), 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tractors
CREATE TABLE tractors (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(6) UNIQUE NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    year INT,
    -- Estado normalizado
    status_id INT REFERENCES resource_statuses(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trailers
CREATE TABLE trailers (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(6) UNIQUE NOT NULL,
    type VARCHAR(50),
    -- Estado normalizado
    status_id INT REFERENCES resource_statuses(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CARGO TYPES (Tipos de Carga Estándar)
CREATE TABLE cargo_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    standard_weight DECIMAL(10, 2) NOT NULL,
    standard_length DECIMAL(10, 2),
    standard_width DECIMAL(10, 2),
    standard_height DECIMAL(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. SERVICES (Servicios - Operaciones)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    
    -- Cliente y Ruta
    client_id INT REFERENCES clients(id),
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    tentative_date DATE,
    
    -- Carga
    cargo_type_id INT REFERENCES cargo_types(id),
    weight DECIMAL(10, 2),
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    observations TEXT,
    
    -- Económico
    price DECIMAL(10, 2),
    currency_id INT REFERENCES currencies(id),
    
    -- Estado normalizado
    status_id INT REFERENCES service_statuses(id),
    
    -- Asignación
    driver_id INT REFERENCES drivers(id),
    tractor_id INT REFERENCES tractors(id),
    trailer_id INT REFERENCES trailers(id),
    
    -- Tiempos reales
    start_date_time TIMESTAMP,
    end_date_time TIMESTAMP,
    
    -- Auditoría
    created_by INT REFERENCES users(id),
    updated_by INT REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SERVICE LOGS (Auditoría)
CREATE TABLE service_audit_logs (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    changed_by INT REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL, -- Sigue siendo útil como texto fijo ('STATUS', 'ASSIGNMENT')
    description TEXT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices Solicitados
CREATE INDEX idx_services_status ON services(status_id);
-- (Index de fecha removido a solicitud)
