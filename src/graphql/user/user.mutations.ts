import { Context, IUpdateUserArgs } from '@/graphql/user/user.types';
import { IUser, User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { securityConfig } from '../../config/app.config';
import { createError } from '../../middleware/errorHandler';
import { BaseError } from '../../types/errors/base.error';

export const userMutations = {
  updateUser: async (
    _: unknown,
    args: { id: string; input: IUpdateUserArgs },
    { isAuthenticated }: Context
  ): Promise<{ success: true; user: IUser }> => {
    try {
      if (!isAuthenticated) {
        throw createError.authentication('Not authenticated');
      }

      const updateData: Partial<IUpdateUserArgs> = {};
      for (const [key, value] of Object.entries(args.input)) {
        if (value !== undefined) {
          updateData[key as keyof IUpdateUserArgs] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw createError.validation('No valid fields provided for update');
      }

      const user = await User.findByIdAndUpdate(
        args.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) throw createError.notFound('User not found');

      return { success: true, user };

      // try {
      //     await sesService.sendEmail({
      //         to: "dheerajgogoi2@gmail.com",
      //         templateName: "NotificationEmail",
      //         templateData: {
      //             appName: "Test Project",
      //             userName: user.firstName || "User",
      //             userEmail: "dheerajgogoi2@gmail.com",
      //             notificationType: "Profile Updated",
      //             message: "Your profile details were recently updated.",
      //             actionText: "View Profile",
      //             actionUrl: "#",
      //             supportEmail: "support@yourapp.com",
      //         },
      //     });
      // } catch (emailError) {
      //     logger.warn("Failed to send profile update notification email", emailError);
      // }
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to update user', {
        operation: 'update',
        entityType: 'User',
      });
    }
  },
  resetPassword: async (
    _: unknown,
    args: { id: string; newPassword: string },
    { isAuthenticated }: Context
  ): Promise<{ success: true; user: IUser }> => {
    try {
      if (!isAuthenticated)
        throw createError.authentication('Not authenticated');

      const salt = await bcrypt.genSalt(securityConfig.bcryptRounds || 12);
      const hashedPassword = await bcrypt.hash(args.newPassword, salt);
      const user = await User.findByIdAndUpdate(
        args.id,
        { $set: { password: hashedPassword } },
        { new: true }
      );

      if (!user) throw createError.notFound('User not found');

      return { success: true, user };
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw createError.database('Failed to reset password', {
        operation: 'reset',
        entityType: 'User',
      });
    }
  },
};
