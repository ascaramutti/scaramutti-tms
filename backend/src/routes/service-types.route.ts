import { Router } from "express";
import { getServiceTypes } from "../controllers/service-types.controller";
import { validateToken } from "../middleware/auth.middleware";
const router = Router();
router.get("/", validateToken, getServiceTypes);
export default router;