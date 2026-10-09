import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/app';

export const client = hc<AppType>('/');
