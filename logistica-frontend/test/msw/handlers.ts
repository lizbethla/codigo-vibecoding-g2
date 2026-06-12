import type { RequestHandler } from 'msw';
import { http, HttpResponse } from 'msw';

export { http, HttpResponse };

export const handlers: RequestHandler[] = [];
