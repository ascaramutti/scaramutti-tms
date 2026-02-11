import { Router } from "express";
import { assignResources, changeStatus, createService, getServiceById, getServices, updateService, addServiceAssignment } from "../controllers/services.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales']), createService);
router.get('/', validateToken, getServices);
router.get('/:id', validateToken, getServiceById);
router.put('/:id', validateToken, authorizeRoles(['admin', 'sales', 'general_manager', 'operations_manager']), updateService);
router.patch('/:id/assign', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), assignResources);
router.patch('/:id/status', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), changeStatus);

// US-003: Agregar unidades adicionales a servicio en ejecución
router.post('/:id/assignments', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'dispatcher']), addServiceAssignment);

export default router;
