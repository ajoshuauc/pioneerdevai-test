import { Router } from 'express';
import { executeController } from '../controllers/executeController.js';

const router = Router();

router.get('/execute', executeController);

export default router;
