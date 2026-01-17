import { Router } from "express";
import { getCurrencies } from "../controllers/currencies.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getCurrencies);

export default router;