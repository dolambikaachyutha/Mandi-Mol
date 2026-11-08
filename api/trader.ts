import { handler } from '../server/functions/trader';
import { createVercelHandler } from '../server/vercelAdapter';

export default createVercelHandler(handler);
