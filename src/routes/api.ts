import { getRedisClient } from '@/config/redis';
import { createError } from '@/middleware/errorHandler';
import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  generateTokens,
  setRefreshTokenCookie,
  verifyAccessToken,
} from '../middleware/authMiddleware';
import {
  basicAuthMiddleware,
  verifyCrmOwner,
} from '../middleware/crmAuthMiddleware';
import { Franchisee } from '../models/Franchisee';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { UserFranchiseeRole } from '../models/UserFranchiseeRole';
import authRoutes from './auth';
import franchiseeRoutes from './franchisee';

interface CreateRoleBody {
  name: string;
  description?: string;
  permissions: Array<{
    resource: string;
    actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'>;
  }>;
}

interface CreateCrmOwnerBody {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface CreateFranchiseeAdminBody {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  franchiseeId: string;
}

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount franchisee routes
router.use('/franchisees', franchiseeRoutes);

// Create new role (CRM Owner only)
router.post(
  '/roles',
  verifyAccessToken,
  verifyCrmOwner,
  async (req: Request<{}, {}, CreateRoleBody>, res: Response) => {
    try {
      const { name, description, permissions } = req.body;

      if (!name || !permissions || !permissions.length) {
        return res.status(400).json({
          message: 'Name and permissions are required',
        });
      }

      // Check if role already exists
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(409).json({
          message: 'Role with this name already exists',
        });
      }

      const role = await Role.create({
        name,
        description,
        permissions,
        isSystemRole: false,
      });

      return res.status(201).json({ role });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create CRM Owner (Basic Auth)
router.post(
  '/crm-owner',
  basicAuthMiddleware,
  async (req: Request<{}, {}, CreateCrmOwnerBody>, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { email, password, username, firstName, lastName } = req.body;

      // Validate request body
      if (!email || !password || !username || !firstName || !lastName) {
        return res.status(400).json({
          message: 'All fields are required',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'User with this email or username already exists',
        });
      }

      // Get CRM Owner role
      const crmOwnerRole = await Role.findOne({ name: 'CRM Owner' });
      if (!crmOwnerRole) {
        // create the role
        await Role.create({
          name: 'CRM Owner',
          description: 'CRM Owner',
          permissions: [],
          isSystemRole: false,
        });
      }

      // Create user
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

      // add to userfranchisee role
      const userFranchiseeRole = await UserFranchiseeRole.create({
        userId: user.userId,
        franchiseeId: uuidv4(),
        roleId: crmOwnerRole?.roleId,
        status: 'active',
      });

      if (!userFranchiseeRole) {
        throw new Error('Failed to create user franchisee role');
      }

      await session.commitTransaction();

      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user.userId);
      setRefreshTokenCookie(res, refreshToken);

      return res.status(201).json({
        accessToken,
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Internal server error' });
    } finally {
      session.endSession();
    }
  }
);

// Create Franchisee Admin (CRM Owner only)
router.post(
  '/franchisee-admin',
  verifyAccessToken,
  verifyCrmOwner,
  async (req: Request<{}, {}, CreateFranchiseeAdminBody>, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { email, password, username, firstName, lastName, franchiseeId } =
        req.body;

      // Validate request body
      if (
        !email ||
        !password ||
        !username ||
        !firstName ||
        !lastName ||
        !franchiseeId
      ) {
        return res.status(400).json({
          message: 'All fields are required',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'User with this email or username already exists',
        });
      }

      // Check if franchisee exists
      const franchisee = await Franchisee.findOne({ franchiseeId });
      if (!franchisee) {
        return res.status(404).json({
          message: 'Franchisee not found',
        });
      }

      // Get Franchisee Admin role
      const adminRole = await Role.findOne({ name: 'Franchisee Admin' });
      if (!adminRole) {
        throw new Error('Franchisee Admin role not found');
      }

      // Create user
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

      // Assign Franchisee Admin role
      await UserFranchiseeRole.create(
        [
          {
            userId: user.userId,
            franchiseeId,
            roleId: adminRole.roleId,
            status: 'active',
            isPrimary: true,
            metadata: {
              acceptedAt: new Date(),
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user.userId);
      setRefreshTokenCookie(res, refreshToken);

      return res.status(201).json({
        accessToken,
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Internal server error' });
    } finally {
      session.endSession();
    }
  }
);

// Cache middleware
const cacheMiddleware = (ttl: number = 300) => {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> => {
    try {
      const redis = getRedisClient();
      const key = `cache:${req.originalUrl}`;

      const cached = await redis.get(key);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      const originalSend = res.json;
      res.json = function (data: unknown): Response {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

// Example cached endpoint
router.get('/cached-data', cacheMiddleware(300), (req, res) => {
  res.json({
    message: 'This data is cached for 5 minutes',
    timestamp: new Date().toISOString(),
  });
});

// Clear cache endpoint
router.delete('/cache', async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    next(createError.database('Failed to clear cache'));
  }
});

// first the role will be created and then the owner or the admin users will be created

// onboard crm admin user role and franchisee admin user role

// crm owner add endpoint based on basic auth with the user id and password

export { router as apiRoutes };
