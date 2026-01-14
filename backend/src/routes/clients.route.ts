import { Router } from "express";
import { getClients } from "../controllers/clients.controller";

const router: Router = Router();

router.get('/', getClients);

export default router;