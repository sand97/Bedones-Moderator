/**
 * Integration test example for the `post` router
 */
import type { inferProcedureInput } from '@trpc/server';
import { createContextInner } from '../context';
import type { AppRouter } from './_app';
import { createCaller } from './_app';
import { prisma as defaultPrisma } from '../prisma';

test('add and get post', async () => {
  if (!defaultPrisma) {
    throw new Error('Database not configured for tests');
  }
  const ctx = await createContextInner({ db: defaultPrisma });
  const caller = createCaller(ctx);

  const input: inferProcedureInput<AppRouter['post']['add']> = {
    id: 'test-post-id',
    pageId: 'test-page-id',
    message: 'hello test',
  };

  const post = await caller.post.add(input);
  const byId = await caller.post.byId({ id: post.id });

  expect(byId).toMatchObject(input);
});
