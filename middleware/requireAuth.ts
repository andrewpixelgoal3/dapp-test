// middleware/requireAuth.js

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const requireAuth = (handler: any) => async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({req});

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return handler(req, res, session);
};

export default requireAuth;
