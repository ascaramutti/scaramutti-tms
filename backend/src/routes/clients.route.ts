import { Router } from "express";
import { createClient, getClients } from "../controllers/clients.controller";

const router: Router = Router();

router.get('/', getClients);
router.post('/', createClient);

export default router;