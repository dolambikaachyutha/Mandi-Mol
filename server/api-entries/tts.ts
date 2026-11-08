import { handler } from '../functions/tts';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

