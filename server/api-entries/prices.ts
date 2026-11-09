import { handler } from '../functions/prices';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

