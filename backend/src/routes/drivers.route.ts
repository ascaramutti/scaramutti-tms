import { Router } from "express";
import { createDriver, getDrivers } from "../controllers/drivers.controller";
import { authorizeRoles, validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getDrivers);
router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager']), createDriver);

export default router;