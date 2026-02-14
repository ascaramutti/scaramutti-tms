import { Router } from "express";
import { getWeeklyTrips, exportWeeklyTrips } from "../controllers/reports.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

/**
 * US-001: Reporte de Viajes Semanales
 * GET /api/reports/weekly-trips?offset={number}
 *
 * Returns weekly trips in master-detail format (expanded rows)
 * - offset: 0 = current week, -1 = previous week, etc.
 */
router.get(
  '/weekly-trips',
  validateToken,
  authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales', 'dispatcher']),
  getWeeklyTrips
);

/**
 * US-001: Export Weekly Trips to Excel
 * GET /api/reports/weekly-trips/export?offset={number}
 *
 * Exports weekly trips to Excel with merged cells (master-detail format)
 * Only allowed for closed weeks (not current week)
 */
router.get(
  '/weekly-trips/export',
  validateToken,
  authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales']),
  exportWeeklyTrips
);

export default router;
