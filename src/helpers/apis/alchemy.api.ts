import { Alchemy } from 'alchemy-sdk';

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: process.env.ALCHEMY_KEY, // Replace with your Alchemy API Key.
  network: process.env.ALCHEMY_NETWORK, // Replace with your network.
};
// @ts-ignore
const alchemy = new Alchemy(settings);
export default alchemy;
