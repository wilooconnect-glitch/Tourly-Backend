import { NextFunction, Request, Response } from 'express';
import { config } from '../config/app.config';
import { Role } from '../models/Role';
import { UserOrganizationRole } from '../models/UserOrganizationRole';

// Basic auth middleware for initial setup for Organization Owner
export const basicAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ message: 'Basic authentication required' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    if (!base64Credentials) {
      return res
        .status(401)
        .json({ message: 'Invalid authorization header format' });
    }

    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8'
    );
    const [username, password] = credentials.split(':');

    // Get predefined credentials from environment variables
    const SETUP_USERNAME = config.admin.username;
    const SETUP_PASSWORD = config.admin.password;

    // Simple comparison with predefined credentials
    if (username !== SETUP_USERNAME || password !== SETUP_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify Organization Owner role middleware
export const verifyCrmOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const organizationOwnerRole = await Role.findOne({ name: 'Organization Owner' });
    if (!organizationOwnerRole) {
      return res.status(500).json({ message: 'Organization Owner role not found' });
    }

    const hasRole = await UserOrganizationRole.findOne({
      userId: user.userId,
      roleId: organizationOwnerRole.roleId,
      status: 'active',
    });

    if (!hasRole) {
      return res
        .status(403)
        .json({ message: 'Access denied. Organization Owner role required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
