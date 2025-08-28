import { config } from '@/config/app.config';
import { User } from '@/models/User';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
}

export interface GraphQLContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  req: Request;
}

export async function context({
  req,
}: {
  req: Request;
}): Promise<GraphQLContext> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return {
      user: null,
      isAuthenticated: false,
      req,
    };
  }

  try {
    // Verify access token
    const decoded = jwt.verify(
      token,
      config.jwt.accessSecret as jwt.Secret
    ) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'access') {
      return {
        user: null,
        isAuthenticated: false,
        req,
      };
    }

    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        req,
      };
    }

    return {
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
      isAuthenticated: true,
      req,
    };
  } catch (error) {
    return {
      user: null,
      isAuthenticated: false,
      req,
    };
  }
}
