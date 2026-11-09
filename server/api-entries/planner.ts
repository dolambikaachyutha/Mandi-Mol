import { handler } from '../functions/planner';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

