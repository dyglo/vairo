// @ts-ignore - helmet installed in backend only
import helmet from 'helmet';
// @ts-ignore
import type { Express } from 'express';

export function configureHelmet(app: Express): void {
  app.use(helmet());
  app.disable('x-powered-by');
}
