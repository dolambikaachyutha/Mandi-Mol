import { handler } from '../functions/profile';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

