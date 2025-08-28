import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { verifyAccessToken } from '../middleware/authMiddleware';
import { verifyCrmOwner } from '../middleware/crmAuthMiddleware';
import { Franchisee } from '../models/Franchisee';
import { Role } from '../models/Role';
import { IUser } from '../models/User';
import { UserFranchiseeRole } from '../models/UserFranchiseeRole';

const router = Router();

interface CreateFranchiseeBody {
  name: string;
  email: string;
  description?: string;
}

router.post(
  '/',
  verifyAccessToken,
  verifyCrmOwner,
  async (req: Request<{}, {}, CreateFranchiseeBody>, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name, email, description } = req.body;
      const user = req.user as IUser;

      if (!name || !email) {
        return res.status(400).json({
          message: 'Name and email are required',
        });
      }

      // Get admin role
      const adminRole = await Role.findOne({ name: 'Franchisee Admin' });
      if (!adminRole) {
        throw new Error(
          'Required roles not found. Please run system initialization.'
        );
      }

      // Create franchisee
      const franchisees = await Franchisee.create(
        [
          {
            name,
            email: email.toLowerCase(),
            description,
            slug: name.toLowerCase().replace(/ /g, '-'),
            status: 'active',
          },
        ],
        { session }
      );

      const franchisee = franchisees[0];
      if (!franchisee) {
        throw new Error('Failed to create franchisee');
      }

      // Add user to franchisee as admin
      await UserFranchiseeRole.create(
        [
          {
            userId: user.userId,
            franchiseeId: franchisee.franchiseeId,
            roleId: adminRole.roleId,
            branchRoleId: uuidv4(),
            branchId: uuidv4(),
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

      return res.status(201).json({
        franchisee: {
          franchiseeId: franchisee.franchiseeId,
          name: franchisee.name,
          slug: franchisee.slug,
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

// add a new user to the franchisee with a role but the verifytoken function will be for the admin of the franchisee

export default router;
