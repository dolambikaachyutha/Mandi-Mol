import { handler } from '../functions/alerts';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

