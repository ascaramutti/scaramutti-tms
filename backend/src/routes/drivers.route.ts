import { Router } from "express";
import { getDrivers } from "../controllers/drivers.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getDrivers);

export default router;