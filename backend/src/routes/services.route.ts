import { Router } from "express";
import { assignResources, createService, getServiceById, getServices } from "../controllers/services.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales']), createService); 
router.get('/', validateToken, getServices);
router.get('/:id', validateToken, getServiceById);
router.patch('/:id/assign', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), assignResources);

export default router;
