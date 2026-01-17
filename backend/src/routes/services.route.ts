import { Router } from "express";
import { assignResources, changeStatus, createService, getServiceById, getServices } from "../controllers/services.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales']), createService);
router.get('/', validateToken, getServices);
router.get('/:id', validateToken, getServiceById);
router.patch('/:id/assign', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), assignResources);
router.patch('/:id/status', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), changeStatus);

export default router;
