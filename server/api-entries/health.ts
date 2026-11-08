import { handler } from '../functions/health';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

