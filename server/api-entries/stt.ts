import { handler } from '../functions/stt';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

