import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Omit<Request, 'user'> {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'JWT secret not configured' 
      });
    }

    // Ensure jwtSecret is string for TypeScript
    const decoded = jwt.verify(token, jwtSecret as string) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    // Cast Mongoose Document to IUser
    req.user = user as unknown as IUser;

    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Authentication error:', error.message);
    } else {
      console.error('Authentication error:', error);
    }
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  // Ensure jwtSecret is string for TypeScript
  return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn } as any);
};
