import { Router } from "express";
import { createClient, getClients } from "../controllers/clients.controller";
import { authorizeRoles, validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getClients);
router.post('/', validateToken, authorizeRoles(['admin', 'sales', 'general_manager', 'operations_manager']), createClient);

export default router;