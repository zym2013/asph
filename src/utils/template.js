import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export const TEMPLATE_DIR = join(__dirname, '..', 'templates');

export const getTemplatePath = (templateName = 'default') => {
  return join(TEMPLATE_DIR, templateName);
};