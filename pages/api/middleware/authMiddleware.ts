import { NextApiRequest, NextApiResponse } from "next";
import jwt from 'jsonwebtoken';

export function withAuth(handler: any) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const access_token = req.headers.authorization?.split(" ")[1];
    if (!access_token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const jwtSecret = process.env.JWT_SECRET || "";
    try {
      const decoded = jwt.verify(access_token, jwtSecret);
      req.body.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}

export default withAuth;