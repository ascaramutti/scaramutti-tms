import { Router } from "express";
import { login, validateSession } from "../controllers/auth.controller";
import { validateToken } from "../middleware/auth.middleware";

const router: Router = Router();

router.post('/login', login);
router.get('/validate', validateToken, validateSession);

export default router;