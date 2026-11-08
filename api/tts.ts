import { handler } from '../server/functions/tts';
import { createVercelHandler } from '../server/vercelAdapter';

export default createVercelHandler(handler);
