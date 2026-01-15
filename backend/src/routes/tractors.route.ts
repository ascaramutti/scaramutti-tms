import { Router } from "express";
import { getTractors } from "../controllers/tractors.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getTractors);

export default router;