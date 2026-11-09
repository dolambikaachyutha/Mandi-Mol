import { handler } from '../functions/voiceQuery';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

