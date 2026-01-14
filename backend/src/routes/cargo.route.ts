import { Router } from "express";
import { getCargoTypes } from "../controllers/cargo.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getCargoTypes);

export default router;