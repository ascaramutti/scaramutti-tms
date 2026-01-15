import { Router } from "express";
import { getTrailers } from "../controllers/trailers.controller";
import { validateToken, authorizeRoles } from "../middleware/auth.middleware";

const router: Router = Router();

router.get('/', validateToken, getTrailers);

export default router;
