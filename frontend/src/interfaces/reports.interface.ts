/**
 * US-001: Weekly Trips Report Interfaces
 */

export interface Driver {
    driver_name: string;
    assignment_note: string;
    is_principal: boolean;
}

export interface WeeklyTrip {
    service_id: number;
    code: string;
    client_name: string;
    service_type: string;
    origin: string;
    destination: string;
    start_date: string;
    end_date: string;
    duration: string;
    price: number;
    currency_code: string;
    principal_driver: Driver;
    additional_drivers: Driver[];
}

export interface TotalByCurrency {
    currency: string;
    total_services: number;
    total_revenue: number;
}

export interface WeeklyTripsResponse {
    week_start: string;
    week_end: string;
    is_current_week: boolean;
    can_export: boolean;
    services: WeeklyTrip[];
    totals_by_currency: TotalByCurrency[];
}
