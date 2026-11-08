import { handler } from '../server/functions/stt';
import { createVercelHandler } from '../server/vercelAdapter';

export default createVercelHandler(handler);
