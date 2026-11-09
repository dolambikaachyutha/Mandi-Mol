import { handler } from '../functions/fpoDashboard';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

