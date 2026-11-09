import { handler } from '../functions/practiceTurn';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

