import { ethers, BigNumberish } from 'ethers';

export const beautifyAddress = (address: string, count = 4) => {
  return `${address.slice(0, count)}...${address.slice(-count)}`;
};

export const toString = (value: string | undefined) => {
  return value || '';
};

export const toInteger = (
  value: number | string | undefined | BigNumberish | boolean,
) => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  return parseInt(value?.toString() || '0');
};

export const toFloat = (value: string | undefined | BigNumberish) => {
  return parseFloat(value?.toString() || '0');
};

export const formatEther = (value: BigNumberish | undefined | string) => {
  if (typeof value === 'object') {
    return toFloat(ethers.utils.formatEther(value));
  }
  return toFloat(value);
};
