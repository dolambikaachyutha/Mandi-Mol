import { handler } from '../server/functions/health';
import { createVercelHandler } from '../server/vercelAdapter';

export default createVercelHandler(handler);
