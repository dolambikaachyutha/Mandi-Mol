import { handler } from '../functions/practiceSession';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

