import { Router } from "express";
import { createTractor, getTractors } from "../controllers/tractors.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getTractors);
router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager']), createTractor);

export default router;