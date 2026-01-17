import { Router } from "express";
import { getServiceStatuses } from "../controllers/service-status.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getServiceStatuses);

export default router;