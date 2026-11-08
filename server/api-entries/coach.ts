import { handler } from '../functions/coach';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

