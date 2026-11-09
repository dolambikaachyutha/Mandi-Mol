import { handler } from '../functions/whatsappWebhook';
import { createVercelHandler } from '../vercelAdapter';

export default createVercelHandler(handler);

