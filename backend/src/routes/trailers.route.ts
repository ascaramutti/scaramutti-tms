import { Router } from "express";
import { createTrailer, getTrailers } from "../controllers/trailers.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getTrailers);
router.post('/', validateToken, authorizeRoles(['admin', 'general_manager', 'operations_manager']), createTrailer);

export default router;
