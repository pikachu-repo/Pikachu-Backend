import { ethers } from 'ethers';
require('dotenv').config();

const PIKACHU_NETWORKS = {
  mainnet: { id: 1, rpc: 'https://rpc.ankr.com/eth' },
  mumbai: { id: 80001, rpc: 'https://rpc.ankr.com/polygon_mumbai' },
};

export const PIKACHU_NETWORK = PIKACHU_NETWORKS[process.env.PIKACHU_NETWORK];

export const ethersProvider = new ethers.providers.JsonRpcProvider(
  PIKACHU_NETWORK.rpc,
);
