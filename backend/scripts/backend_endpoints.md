# Backend API Endpoints Requirements

Based on the developed design prototype, the following API endpoints are required to support the frontend functionality.

## 1. Authentication & Users
*   **POST** `/api/auth/login`
    *   **Body**: `{ email, password }`
    *   **Response**: `{ token, user: { id, name, email, role } }`
    *   **Purpose**: Authenticate users (Admin, Dispatcher, Driver).

*   **GET** `/api/access/validate`
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Purpose**: Validate session token on page reload.

## 2. Dashboard & Statistics
*   **GET** `/api/dashboard/stats`
    *   **Query Params**: `?role=<userRole>` (optional, for role-specific stats)
    *   **Response**: `{ activeServices, pendingServices, availableDrivers, availableVehicles }`
    *   **Purpose**: Populate the "Resumen General" cards.

## 3. Services Management
### Listings
*   **GET** `/api/services`
    *   **Query Params**: 
        *   `status`: 'pending' | 'pending_start' | 'active' | 'completed'
        *   `search`: string (for the new search bar filter)
    *   **Response**: `Array<Service>`
    *   **Purpose**: Populate Dashboard list, Pending, Pending Start, and Active pages.

### Service Operations
*   **POST** `/api/services`
    *   **Body**: `{ clientId, origin, destination, tentativeDate, price, currencyId, serviceType, cargoTypeId, cargoWeight, cargoVolume, cargoDescription, observations }`
    *   **Purpose**: Create a new service request.

*   **GET** `/api/services/:id`
    *   **Response**: `Service` (Full details including history)
    *   **Purpose**: Fetch data for the **Service Detail Modal** and Edit forms.

*   **PUT** `/api/services/:id`
    *   **Body**: `{ ...updatedFields }`
    *   **Purpose**: Edit service details (Admin only).

*   **PATCH** `/api/services/:id/assign`
    *   **Body**: `{ driverId, tractorId, trailerId, notes }`
    *   **Purpose**: Assign resources to a pending service.

*   **PATCH** `/api/services/:id/start`
    *   **Body**: `{ startDateTime, additionalNotes }`
    *   **Purpose**: Mark a service as "In Progress" (Active).

*   **PATCH** `/api/services/:id/finish`
    *   **Body**: `{ endDateTime, completionNotes }`
    *   **Purpose**: Mark a service as "Completed".

## 4. Clients
*   **GET** `/api/clients`
    *   **Query Params**: `?search=<name/ruc>`
    *   **Response**: `Array<{ id, name, ruc, phone, address }>`
    *   **Purpose**: Autocomplete in "Crear Servicio" form.

*   **POST** `/api/clients`
    *   **Body**: `{ name, ruc, phone, address, contactName }`
    *   **Purpose**: create a new client from the service creation flow.

## 5. Cargo Management
*   **GET** `/api/cargo-types`
    *   **Response**: `Array<{ id, name, description, defaultMetrics }>`
    *   **Purpose**: Populate the "Tipo de Carga" dropdown (Standard Catalog).

*   **POST** `/api/cargo-types`
    *   **Body**: `{ name, description, defaultMetrics }`
    *   **Purpose**: Create a new standard cargo type when it doesn't exist.

## 6. Resources Management

### Tractors (Unidades Tracto)
*   **GET** `/api/tractors`
    *   **Query Params**: `?status=available`
    *   **Response**: `Array<{ id, plate, brand, model, year, status }>`
    *   **Purpose**: List available tractors for assignment drop-downs.

*   **POST** `/api/tractors`
    *   **Body**: `{ plate, brand, model, year, status }`
    *   **Purpose**: Register a new tractor.

### Trailers (Carretas/Remolques)
*   **GET** `/api/trailers`
    *   **Query Params**: `?status=available`
    *   **Response**: `Array<{ id, plate, type, capacityKg, dimensions, status }>`
    *   **Purpose**: List available trailers for assignment drop-downs.

*   **POST** `/api/trailers`
    *   **Body**: `{ plate, type, capacityKg, dimensions, status }`
    *   **Purpose**: Register a new trailer.

### Drivers
*   **GET** `/api/drivers`
    *   **Query Params**: `?status=available`
    *   **Response**: `Array<{ id, name, license, status }>`
    *   **Purpose**: Populate "Conductor" dropdown in Assignment Modal.

## 7. Audit & History (Optional but Recommended)
*   **GET** `/api/services/:id/logs`
    *   **Response**: `Array<{ action, user, timestamp, details }>`
    *   **Purpose**: Show the service history (created, assigned, started, completed) in the detail view.
