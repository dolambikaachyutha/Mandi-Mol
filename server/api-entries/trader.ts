import { handler } from '../functions/trader';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

