import { handler } from '../functions/consent';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

