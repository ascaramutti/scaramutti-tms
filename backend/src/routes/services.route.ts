import { Router } from "express";
import { createService, getServices } from "../controllers/services.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager', 'sales']), createService); 
router.get('/', validateToken, getServices);

export default router;
