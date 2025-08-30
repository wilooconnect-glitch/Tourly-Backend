import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app.config';
import {
  clearRefreshTokenCookie,
  generateTokens,
  revokeRefreshToken,
  setRefreshTokenCookie,
  verifyAccessToken,
} from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { Role } from '../models/Role';
import { IUser, User } from '../models/User';
import { UserOrganizationRole } from '../models/UserOrganizationRole';
import { parseTimeString } from '../utils/timeUtils';

const router = Router();

interface RefreshTokenBody {
  refreshToken: string;
}

interface RegisterBody {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

interface LoginBody {
  email: string;
  password: string;
  organizationId?: string;
}

// Register endpoint
router.post(
  '/register',
  async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    // Start a new session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { email, password, username, firstName, lastName, organizationId } =
        req.body;

      // Validate request body
      if (
        !email ||
        !password ||
        !username ||
        !firstName ||
        !lastName ||
        !organizationId
      ) {
        await session.endSession();
        return res.status(400).json({
          message:
            'All fields are required: email, password, username, firstName, lastName, franchiseeId',
        });
      }

      // Check if user already exists - do this outside transaction as it's just a read
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          message: 'User with this email or username already exists',
        });
      }
      // Get admin role - do this outside transaction as it's just a read
      const adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          message:
            'Required roles not found. Please run system initialization.',
        });
      }

      // Create new user within transaction
      const users = await User.create(
        [
          {
            email: email.toLowerCase(),
            password,
            username: username.toLowerCase(),
            firstName,
            lastName,
          },
        ],
        { session }
      );

      const user = users[0];
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Add user to franchisee as admin within transaction
      await UserOrganizationRole.create(
        [
          {
            userId: user.userId,
            organizationId: organizationId,
            roleId: adminRole.roleId,
            status: 'active',
            branchRoleId: '1',
            isPrimary: true,
            metadata: {
              acceptedAt: new Date(),
            },
          },
        ],
        { session }
      );
      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user.userId);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      // Return only the access token in response
      return res.status(201).json({
        accessToken,
        organization: {
          organizationId: organizationId,
        },
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Login endpoint
router.post(
  '/login',
  async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate request body
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get client info for audit trail
      const ip = req.ip || req.connection.remoteAddress || undefined;
      const userAgent = req.get('User-Agent');

      // Generate tokens with client info
      const { accessToken, refreshToken } = await generateTokens(
        user.userId,
        ip,
        userAgent
      );

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      // if (!branchId) {
      //   const allBranches = await UserFranchiseeRole.find({
      //     userId: user.userId,
      //   });

      //   const topmostBranchId = allBranches?.[0]?.branchId;

      //   if (!topmostBranchId) {
      //     return res.status(400).json({ message: 'No branch found' });
      //   }

      //   return res.json({
      //     accessToken,
      //     branchId: topmostBranchId,
      //   });
      // }

      // Return only the access token in response
      return res.json({
        accessToken
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get authenticated user info
router.get('/me', verifyAccessToken, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
router.post(
  '/logout',
  verifyAccessToken,
  async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }

      clearRefreshTokenCookie(res);

      return res.json({
        message: 'Successfully logged out',
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Refresh token endpoint
router.post(
  '/refresh',
  async (req: Request<{}, {}, RefreshTokenBody>, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const ip = req.ip || req.connection.remoteAddress || undefined;
      const userAgent = req.get('User-Agent');

      const { TokenService } = await import('../services/tokenService');

      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as unknown as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid token type' });
      }

      const { token: newRefreshToken } = await TokenService.rotateRefreshToken(
        refreshToken,
        decoded.userId,
        ip,
        userAgent
      );

      const accessToken = jwt.sign(
        { userId: decoded.userId, type: 'access' },
        config.jwt.accessSecret as jwt.Secret,
        { expiresIn: config.jwt.accessExpiresIn || '15m' } as jwt.SignOptions
      );

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.app.environment === 'production',
        sameSite: 'strict',
        maxAge: parseTimeString(config.jwt.refreshExpiresIn || '30d'),
        path: '/api/auth/refresh',
      });

      return res.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Token reuse detected - security compromised') {
          res.clearCookie('refreshToken', {
            path: '/api/auth/refresh',
          });
          return res.status(401).json({
            message: 'Security compromised - please login again',
            code: 'TOKEN_REUSE_DETECTED',
          });
        }
        if (
          error.message === 'Invalid token type' ||
          error.message === 'User not found' ||
          error.message === 'Invalid or expired refresh token'
        ) {
          return res.status(401).json({ message: error.message });
        }
      }
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
);

export default router;
