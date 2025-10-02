import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Intercepts Better Auth's default error page and redirects to our custom error page
 * This is a workaround for Better Auth's errorURL config being ignored (known bug)
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;

  // Redirect to our custom error page with the error code
  const errorParam = error ? `?error=${error}` : '';
  res.redirect(302, `/auth-error${errorParam}`);
}
