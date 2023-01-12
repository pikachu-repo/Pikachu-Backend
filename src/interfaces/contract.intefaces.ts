import { BigNumberish } from 'ethers';

export type TAdminSettingStruct = {
  feeTo: string;
  minDepositAmount: BigNumberish;
  platformFee: number;
  blockNumberSlippage: number;
  verifiedCollections: string[];
};
