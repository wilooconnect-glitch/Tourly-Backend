import { IAddress, IClient } from '@/types/types';
import { Address } from '../../models/Address';

export const clientResolvers = {
  addresses: async (parent: IClient): Promise<IAddress | []> => {
    if (!parent.addressIds || parent.addressIds.length === 0) {
      return [];
    }
    return await Address.find({ addressId: { $in: parent.addressIds } }).lean();
  },
};
