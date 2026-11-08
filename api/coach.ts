import { handler } from '../server/functions/coach';
import { createVercelHandler } from '../server/vercelAdapter';

export default createVercelHandler(handler);
