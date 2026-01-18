import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/stats', validateToken, getDashboardStats);

export default router;
