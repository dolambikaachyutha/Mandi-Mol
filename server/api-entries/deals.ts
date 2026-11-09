import { handler } from '../functions/deals';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

