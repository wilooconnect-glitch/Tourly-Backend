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
import { Organization } from '../models/Organization';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { UserOrganizationRole } from '../models/UserOrganizationRole';
import authRoutes from './auth';
import organizationRoutes from './organization';

interface CreateRoleBody {
  name: string;
  description?: string;
  permissions: Array<{
    resource: string;
    actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'>;
  }>;
}

interface CreateOrganizationOwnerBody {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}
  
interface CreateOrganizationAdminBody {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount organization routes
router.use('/organizations', organizationRoutes);

// Create new role (Organization Owner only)
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

// Create Organization Owner (Basic Auth)
router.post(
  '/organization-owner',
  basicAuthMiddleware,
  async (req: Request<{}, {}, CreateOrganizationOwnerBody>, res: Response) => {
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

      // Get Organization Owner role
      const organizationOwnerRole = await Role.findOne({ name: 'Organization Owner' });
      if (!organizationOwnerRole) {
        // create the role
        await Role.create({
          name: 'Organization Owner',
          description: 'Organization Owner',
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

      // add to userorganization role
      const userOrganizationRole = await UserOrganizationRole.create({
        userId: user.userId,
        organizationId: uuidv4(),
        roleId: organizationOwnerRole?.roleId,
        status: 'active',
      });

      if (!userOrganizationRole) {
        throw new Error('Failed to create user organization role');
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

// Create Organization Admin (Organization Owner only)
router.post(
  '/organization-admin',
  verifyAccessToken,
  verifyCrmOwner,
  async (req: Request<{}, {}, CreateOrganizationAdminBody>, res: Response) => {
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

      // Check if organization exists
      const organization = await Organization.findOne({ organizationId });
      if (!organization) {
        return res.status(404).json({
          message: 'Organization not found',
        });
      }

      // Get Organization Admin role
      const adminRole = await Role.findOne({ name: 'Organization Admin' });
      if (!adminRole) {
        throw new Error('Organization Admin role not found');
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

      // Assign Organization Admin role
      await UserOrganizationRole.create(
        [
          {
            userId: user.userId,
            organizationId,
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

// onboard organization admin user role and organization admin user role

// organization owner add endpoint based on basic auth with the user id and password

export { router as apiRoutes };
