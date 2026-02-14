import { Request, Response } from "express";
import { query } from "../config/db";
import { ErrorResponse } from "../interfaces/error/error.interface";
import ExcelJS from 'exceljs';

/**
 * US-001: Helper function to calculate week dates (Wednesday to Tuesday)
 * @param offset - 0 = current week, -1 = previous week, etc.
 * @returns { startDate, endDate, isClosed }
 */
function getWeekDates(offset: number = 0): { startDate: Date; endDate: Date; isClosed: boolean } {
    const now = new Date();
    const peruDateString = now.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
    const [py, pm, pd] = peruDateString.split('-').map(Number);

    // Create date in Peru timezone (UTC-5)
    const peruYear = py || 2023;
    const peruMonth = (pm || 1) - 1;
    const peruDay = pd || 1;

    // Get current day of week
    const peruAnchor = new Date(Date.UTC(peruYear, peruMonth, peruDay, 5, 0, 0, 0)); // Add 5 hours for Peru timezone
    const currentDay = peruAnchor.getUTCDay();

    // Calculate last Wednesday (start of current week)
    const daysSinceWednesday = (currentDay + 7 - 3) % 7;

    // Start date: Wednesday at 00:00:00 Peru time (05:00:00 UTC)
    const startDate = new Date(Date.UTC(
        peruYear,
        peruMonth,
        peruDay - daysSinceWednesday + (offset * 7),
        5, 0, 0, 0 // 00:00 Peru = 05:00 UTC
    ));

    // End date: Tuesday (6 days later) at 23:59:59 Peru time (04:59:59 UTC next day)
    const endDate = new Date(Date.UTC(
        peruYear,
        peruMonth,
        peruDay - daysSinceWednesday + 6 + (offset * 7) + 1, // +1 day for next day in UTC
        4, 59, 59, 999 // 23:59:59 Peru = 04:59:59 UTC next day
    ));

    // Week is closed if it's not the current week (offset < 0)
    const isClosed = offset < 0;

    return { startDate, endDate, isClosed };
}

interface WeeklyTripRow {
    service_id: number;
    code: string | null;
    client_name: string | null;
    driver_name: string | null;
    assignment_reason: string | null;
    is_principal: boolean;
    origin: string | null;
    destination: string | null;
    service_type: string | null;
    start_date: Date | null;
    end_date: Date | null;
    total_minutes: number | null;
    price: number | null;
    currency_code: string | null;
    assignment_order: number;
}

interface Driver {
    driver_name: string;
    assignment_note: string;
    is_principal: boolean;
}

interface ServiceWithDrivers {
    service_id: number;
    code: string;
    client_name: string;
    origin: string;
    destination: string;
    service_type: string;
    start_date: Date;
    end_date: Date;
    duration: string;
    price: number | null;
    currency_code: string;
    principal_driver: Driver;
    additional_drivers: Driver[];
}

interface DriverSummary {
    driver_name: string;
    total_trips: number;
    shared_trips: number;
    total_revenue: number;
}

interface TotalByCurrency {
    currency: string;
    total_services: number;
    total_revenue: number;
}

interface WeeklyTripsResponse {
    week_start: string;
    week_end: string;
    is_current_week: boolean;
    can_export: boolean;
    services: ServiceWithDrivers[];
    totals_by_currency: TotalByCurrency[];
}

/**
 * US-001: Get Weekly Trips Report
 * GET /api/reports/weekly-trips?offset={number}
 */
export const getWeeklyTrips = async (
    req: Request,
    res: Response<WeeklyTripsResponse | ErrorResponse>
): Promise<void> => {
    try {
        const offset = parseInt(req.query.offset as string) || 0;
        const { startDate, endDate, isClosed } = getWeekDates(offset);

        const userRole = (req as any).user?.role;

        // Master-detail query: UNION ALL approach
        // First part: principal drivers (main service assignment)
        // Second part: derived drivers (from service_assignments)
        const tripsResult = await query<WeeklyTripRow>(`
            -- Principal driver row
            SELECT
                s.id as service_id,
                ('SRV-' || LPAD(s.id::text, 3, '0')) as code,
                c.name as client_name,
                (w.first_name || ' ' || w.last_name) as driver_name,
                'Conductor Principal' as assignment_reason,
                true as is_principal,
                s.origin,
                s.destination,
                st.name as service_type,
                s.start_date_time as start_date,
                s.end_date_time as end_date,
                FLOOR(EXTRACT(EPOCH FROM (s.end_date_time - s.start_date_time)) / 60) as total_minutes,
                ${userRole === 'dispatcher' ? 'NULL' : 's.price'} as price,
                cur.code as currency_code,
                0 as assignment_order
            FROM services s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN workers w ON d.worker_id = w.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN currencies cur ON s.currency_id = cur.id
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2

            UNION ALL

            -- Derived drivers rows (from service_assignments)
            SELECT
                s.id as service_id,
                NULL as code,
                NULL as client_name,
                (w.first_name || ' ' || w.last_name) as driver_name,
                sa.notes as assignment_reason,
                false as is_principal,
                NULL as origin,
                NULL as destination,
                NULL as service_type,
                NULL as start_date,
                NULL as end_date,
                NULL as total_minutes,
                NULL as price,
                NULL as currency_code,
                ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY sa.assigned_at) as assignment_order
            FROM services s
            INNER JOIN service_assignments sa ON s.id = sa.service_id
              AND sa.driver_id IS NOT NULL
            INNER JOIN drivers d ON sa.driver_id = d.id
            INNER JOIN workers w ON d.worker_id = w.id
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2

            ORDER BY service_id, assignment_order
        `, [startDate, endDate]);

        // Transform flat rows to nested structure
        const servicesMap = new Map<number, ServiceWithDrivers>();

        tripsResult.rows.forEach(row => {
            if (row.is_principal) {
                // Calculate duration in "Xd Yh Zm" format
                const totalMinutes = parseInt(row.total_minutes as any) || 0;
                const days = Math.floor(totalMinutes / (24 * 60));
                const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
                const minutes = totalMinutes % 60;

                let duration = '';
                if (days > 0) duration += `${days}d `;
                if (hours > 0 || days > 0) duration += `${hours}h `;
                duration += `${minutes}m`;
                duration = duration.trim();

                // Principal driver row - create service entry
                servicesMap.set(row.service_id, {
                    service_id: row.service_id,
                    code: row.code!,
                    client_name: row.client_name!,
                    origin: row.origin!,
                    destination: row.destination!,
                    service_type: row.service_type!,
                    start_date: row.start_date!,
                    end_date: row.end_date!,
                    duration: duration,
                    price: userRole === 'dispatcher' ? null : row.price,
                    currency_code: (row as any).currency_code!,
                    principal_driver: {
                        driver_name: row.driver_name!,
                        assignment_note: row.assignment_reason!,
                        is_principal: true
                    },
                    additional_drivers: []
                });
            } else {
                // Additional driver row - add to existing service
                const service = servicesMap.get(row.service_id);
                if (service) {
                    service.additional_drivers.push({
                        driver_name: row.driver_name!,
                        assignment_note: row.assignment_reason!,
                        is_principal: false
                    });
                }
            }
        });

        const services = Array.from(servicesMap.values());

        // Calculate driver summary
        const driverSummaryResult = await query<DriverSummary>(`
            WITH all_drivers AS (
                -- Principal drivers
                SELECT
                    s.id as service_id,
                    (w.first_name || ' ' || w.last_name) as driver_name,
                    s.price,
                    (SELECT COUNT(*) FROM service_assignments sa2 WHERE sa2.service_id = s.id AND sa2.driver_id IS NOT NULL) > 0 as is_shared
                FROM services s
                LEFT JOIN drivers d ON s.driver_id = d.id
                LEFT JOIN workers w ON d.worker_id = w.id
                JOIN service_statuses ss ON s.status_id = ss.id
                WHERE ss.name = 'completed'
                  AND s.end_date_time >= $1 AND s.end_date_time <= $2

                UNION ALL

                -- Derived drivers
                SELECT
                    s.id as service_id,
                    (w.first_name || ' ' || w.last_name) as driver_name,
                    s.price,
                    true as is_shared
                FROM services s
                INNER JOIN service_assignments sa ON s.id = sa.service_id AND sa.driver_id IS NOT NULL
                INNER JOIN drivers d ON sa.driver_id = d.id
                INNER JOIN workers w ON d.worker_id = w.id
                JOIN service_statuses ss ON s.status_id = ss.id
                WHERE ss.name = 'completed'
                  AND s.end_date_time >= $1 AND s.end_date_time <= $2
            )
            SELECT
                driver_name,
                COUNT(DISTINCT service_id) as total_trips,
                COUNT(DISTINCT CASE WHEN is_shared THEN service_id END) as shared_trips,
                ${userRole === 'dispatcher' ? '0' : 'SUM(DISTINCT price)'} as total_revenue
            FROM all_drivers
            GROUP BY driver_name
            ORDER BY driver_name
        `, [startDate, endDate]);

        // Calculate totals by currency
        const totalsByCurrencyResult = await query<{ currency: string; count: string; revenue: string }>(`
            SELECT
                cur.code as currency,
                COUNT(DISTINCT s.id) as count,
                ${userRole === 'dispatcher' ? '0' : 'SUM(s.price)'} as revenue
            FROM services s
            LEFT JOIN currencies cur ON s.currency_id = cur.id
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2
            GROUP BY cur.code
            ORDER BY cur.code
        `, [startDate, endDate]);

        // Calculate total unique drivers
        const driversResult = await query<{ drivers: string }>(`
            SELECT
                COUNT(DISTINCT s.driver_id) +
                COUNT(DISTINCT sa.driver_id) as drivers
            FROM services s
            LEFT JOIN service_assignments sa ON s.id = sa.service_id AND sa.driver_id IS NOT NULL
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2
        `, [startDate, endDate]);

        const byCurrency: TotalByCurrency[] = totalsByCurrencyResult.rows.map(row => ({
            currency: row.currency,
            total_services: parseInt(row.count),
            total_revenue: parseFloat(row.revenue) || 0
        }));

        const totalServices = byCurrency.reduce((sum, curr) => sum + curr.total_services, 0);
        const uniqueDrivers = parseInt(driversResult.rows[0]?.drivers || '0');

        res.json({
            week_start: startDate.toISOString(),
            week_end: endDate.toISOString(),
            is_current_week: !isClosed,
            can_export: isClosed,
            services: services,
            totals_by_currency: byCurrency
        });
    } catch (error) {
        console.error('Error getting weekly trips:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error al obtener el reporte de viajes semanales'
        });
    }
};

/**
 * US-001: Export Weekly Trips to Excel
 * GET /api/reports/weekly-trips/export?offset={number}
 */
export const exportWeeklyTrips = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const offset = parseInt(req.query.offset as string) || 0;
        const { startDate, endDate, isClosed } = getWeekDates(offset);

        // Only allow export for closed weeks
        if (!isClosed) {
            res.status(400).json({
                status: 'ERROR',
                message: 'Solo se puede exportar semanas cerradas'
            });
            return;
        }

        // Fetch data (reuse same query logic)
        const tripsResult = await query<WeeklyTripRow>(`
            SELECT
                s.id as service_id,
                ('SRV-' || LPAD(s.id::text, 3, '0')) as code,
                c.name as client_name,
                (w.first_name || ' ' || w.last_name) as driver_name,
                'Conductor Principal' as assignment_reason,
                true as is_principal,
                s.origin,
                s.destination,
                st.name as service_type,
                s.start_date_time as start_date,
                s.end_date_time as end_date,
                FLOOR(EXTRACT(EPOCH FROM (s.end_date_time - s.start_date_time)) / 60) as total_minutes,
                s.price,
                cur.code as currency_code,
                0 as assignment_order
            FROM services s
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN workers w ON d.worker_id = w.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN currencies cur ON s.currency_id = cur.id
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2

            UNION ALL

            SELECT
                s.id as service_id,
                NULL as code,
                NULL as client_name,
                (w.first_name || ' ' || w.last_name) as driver_name,
                sa.notes as assignment_reason,
                false as is_principal,
                NULL as origin,
                NULL as destination,
                NULL as service_type,
                NULL as start_date,
                NULL as end_date,
                NULL as total_minutes,
                NULL as price,
                NULL as currency_code,
                ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY sa.assigned_at) as assignment_order
            FROM services s
            INNER JOIN service_assignments sa ON s.id = sa.service_id AND sa.driver_id IS NOT NULL
            INNER JOIN drivers d ON sa.driver_id = d.id
            INNER JOIN workers w ON d.worker_id = w.id
            JOIN service_statuses ss ON s.status_id = ss.id
            WHERE ss.name = 'completed'
              AND s.end_date_time >= $1 AND s.end_date_time <= $2

            ORDER BY service_id, assignment_order
        `, [startDate, endDate]);

        // Transform flat rows to nested structure
        const servicesMap = new Map<number, ServiceWithDrivers>();

        tripsResult.rows.forEach(row => {
            if (row.is_principal) {
                // Calculate duration in "Xd Yh Zm" format
                const totalMinutes = parseInt(row.total_minutes as any) || 0;
                const days = Math.floor(totalMinutes / (24 * 60));
                const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
                const minutes = totalMinutes % 60;

                let duration = '';
                if (days > 0) duration += `${days}d `;
                if (hours > 0 || days > 0) duration += `${hours}h `;
                duration += `${minutes}m`;
                duration = duration.trim();

                servicesMap.set(row.service_id, {
                    service_id: row.service_id,
                    code: row.code!,
                    client_name: row.client_name!,
                    origin: row.origin!,
                    destination: row.destination!,
                    service_type: row.service_type!,
                    start_date: row.start_date!,
                    end_date: row.end_date!,
                    duration: duration,
                    price: row.price,
                    currency_code: row.currency_code!,
                    principal_driver: {
                        driver_name: row.driver_name!,
                        assignment_note: row.assignment_reason!,
                        is_principal: true
                    },
                    additional_drivers: []
                });
            } else {
                const service = servicesMap.get(row.service_id);
                if (service) {
                    service.additional_drivers.push({
                        driver_name: row.driver_name!,
                        assignment_note: row.assignment_reason!,
                        is_principal: false
                    });
                }
            }
        });

        const services = Array.from(servicesMap.values());

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Detalle de Viajes');

        // Set page setup for A4 horizontal
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
        };

        // Headers
        worksheet.columns = [
            { header: 'Código', key: 'code', width: 10 },
            { header: 'Cliente', key: 'client', width: 25 },
            { header: 'Conductor', key: 'driver', width: 22 },
            { header: 'Motivo Asignación', key: 'reason', width: 28 },
            { header: 'Origen', key: 'origin', width: 20 },
            { header: 'Destino', key: 'destination', width: 20 },
            { header: 'Tipo', key: 'type', width: 12 },
            { header: 'F. Inicio', key: 'start', width: 16 },
            { header: 'F. Fin', key: 'end', width: 16 },
            { header: 'Duración', key: 'duration', width: 14 },
            { header: 'Moneda', key: 'currency', width: 8 },
            { header: 'Precio', key: 'price', width: 12 },
            { header: 'Bono', key: 'bonus', width: 12 }
        ];

        // Style headers (only table columns A-M)
        const headerRow = worksheet.getRow(1);
        headerRow.height = 25;

        // Apply styles only to table columns (A-M = 1-13)
        for (let col = 1; col <= 13; col++) {
            const cell = headerRow.getCell(col);
            cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }

        // Add data with merged cells (using nested structure)
        let currentRow = 2;

        services.forEach((service, serviceIndex) => {
            // Alternate background colors by service (light blue / white)
            const isEvenService = serviceIndex % 2 === 0;
            const serviceBgColor = isEvenService ? 'FFFFFFFF' : 'FFE3F2FD'; // White / Light Blue
            const driversBgColor = isEvenService ? 'FFF5F5F5' : 'FFD1E7F5'; // Light Gray / Lighter Blue
            const serviceStartRow = currentRow;
            const totalRows = 1 + service.additional_drivers.length; // Principal + additional

            // Format dates with time
            const startDateTime = new Date(service.start_date).toLocaleString('es-PE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            const endDateTime = new Date(service.end_date).toLocaleString('es-PE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });

            // Add principal driver row
            const principalRow = worksheet.addRow({
                code: service.code,
                client: service.client_name,
                driver: service.principal_driver.driver_name,
                reason: service.principal_driver.assignment_note,
                origin: service.origin,
                destination: service.destination,
                type: service.service_type,
                start: startDateTime,
                end: endDateTime,
                duration: service.duration,
                currency: service.currency_code,
                price: service.price,
                bonus: '' // Empty for manual entry
            });

            // Style principal row (only table columns A-M)
            principalRow.height = 30;
            for (let col = 1; col <= 13; col++) {
                const cell = principalRow.getCell(col);
                cell.font = { size: 11 };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: serviceBgColor }
                };
            }

            currentRow++;

            // Add additional drivers rows
            service.additional_drivers.forEach((driver) => {
                const row = worksheet.addRow({
                    code: '', // Empty
                    client: '',
                    driver: driver.driver_name,
                    reason: driver.assignment_note,
                    origin: '',
                    destination: '',
                    type: '',
                    start: '',
                    end: '',
                    duration: '',
                    currency: '',
                    price: '',
                    bonus: ''
                });

                // Style additional driver rows (only table columns A-M)
                row.height = 30;
                for (let col = 1; col <= 13; col++) {
                    const cell = row.getCell(col);
                    cell.font = { size: 11 };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: driversBgColor } // Slightly darker than service
                    };
                }
                currentRow++;
            });

            // Merge cells for service data (if there are additional drivers)
            if (totalRows > 1) {
                const endRow = currentRow - 1;
                // Merge: Code, Client, Origin, Destination, Type, Start, End, Duration, Currency, Price, Bonus
                ['A', 'B', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
                    worksheet.mergeCells(`${col}${serviceStartRow}:${col}${endRow}`);
                });
            }
        });

        // Add totals section
        currentRow += 2; // Skip 2 rows

        // Calculate totals by currency
        const totalsByCurrency = new Map<string, { count: number, total: number }>();
        services.forEach(service => {
            const currency = service.currency_code;
            const existing = totalsByCurrency.get(currency) || { count: 0, total: 0 };
            const price = typeof service.price === 'number' ? service.price : parseFloat(service.price as any) || 0;
            totalsByCurrency.set(currency, {
                count: existing.count + 1,
                total: existing.total + price
            });
        });

        // Total viajes row
        const totalServicesRow = worksheet.addRow({
            code: '',
            client: 'TOTAL DE VIAJES:',
            driver: services.length.toString()
        });
        totalServicesRow.font = { bold: true, size: 12 };
        totalServicesRow.getCell(2).alignment = { horizontal: 'right' };
        totalServicesRow.getCell(3).alignment = { horizontal: 'left' };

        // Total by currency rows
        Array.from(totalsByCurrency.entries()).forEach(([currency, data]) => {
            const totalRow = worksheet.addRow({
                code: '',
                client: `TOTAL ${currency}:`,
                driver: Number(data.total).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            });
            totalRow.font = { bold: true, size: 12 };
            totalRow.getCell(2).alignment = { horizontal: 'right' };
            totalRow.getCell(3).alignment = { horizontal: 'right' };
            totalRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF0000FF' } }; // Blue
        });

        // Generate filename
        const formatDate = (date: Date) => {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
        };
        const filename = `reporte_viajes_semana_${formatDate(startDate)}_${formatDate(endDate)}.xlsx`;

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting weekly trips:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error al exportar el reporte de viajes'
        });
    }
};
