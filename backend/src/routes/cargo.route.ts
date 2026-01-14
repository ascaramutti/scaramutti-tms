import { Router } from "express";
import { createCargoType, getCargoTypes } from "../controllers/cargo.controller";
import { authorizeRoles, validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getCargoTypes);
router.post('/', validateToken, authorizeRoles(['admin', 'sales', 'general_manager', 'operations_manager']), createCargoType);

export default router;