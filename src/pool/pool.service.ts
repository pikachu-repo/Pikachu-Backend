import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PikachuContract } from 'src/helpers/contract.constants';
import {
  CONVALENTQ_KEY,
  ethersProvider,
  ethersSigner,
} from 'src/helpers/provider.constants';
import fetch from 'node-fetch';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import { toFloat, toInteger, toString } from 'src/helpers/string.helpers';
import { Setting, SettingDocument } from './schema/setting.schema';
import { Pool, PoolDocument } from './schema/pool.schema';
import { Loan, LoanDocument } from './schema/loan.schema';
import { TAdminSettingStruct } from 'src/interfaces/contract.intefaces';
import alchemy from 'src/helpers/apis/alchemy.api';
import { Collection, CollectionDocument } from './schema/collection.schema';

type Event = {
  block_height: number;
  block_signed_at: string;
  raw_log_data: string;
  raw_log_topics: string[];
  sender_address: string;
  tx_hash: string;
};
@Injectable()
export class PoolService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,

    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,

    @InjectModel(Pool.name)
    private readonly poolModel: Model<PoolDocument>,

    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
  ) {}

  async findAll(): Promise<any> {
    return await this.fetchPools();
  }

  async findLoansByPoolId(poolId: number): Promise<Loan[]> {
    return await this.loanModel.find({ poolId }).lean().exec();
  }
  async findLoansByPoolIdAndBorrower(
    poolId: number,
    borrower: string,
  ): Promise<Loan> {
    return await this.loanModel
      .findOne({ poolId, borrower }, {}, { sort: { blockNumber: -1 } })
      .lean()
      .exec();
  }

  async findLoansByBorrower(borrower: string): Promise<Loan[]> {
    return await this.loanModel.find({ borrower }).lean().exec();
  }

  async getPikachuEvents(
    address: string,
    event: string | string[],
    startingBlock: number,
    endingBlock: number,
  ): Promise<Event[]> {
    try {
      let result = await fetch(
        `https://api.covalenthq.com/v1/80001/events/topics/${event}/?quote-currency=USD&format=JSON&starting-block=${startingBlock}&ending-block=${endingBlock}&sender-address=${address}&page-number=&key=${CONVALENTQ_KEY}`,
      );

      result = await result.json();
      if (result.error === true) return [];
      return result.data.items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async getLastBlockHeight(): Promise<number> {
    try {
      let result = await fetch(
        `https://api.covalenthq.com/v1/80001/block_v2/latest/?quote-currency=USD&format=JSON&key=${CONVALENTQ_KEY}`,
      );

      result = await result.json();
      if (result.error === true) return 0;
      return result.data.items[0].height;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  async fetchPools(offset = 0) {
    const pageSize = 10 ** 6;
    const [setting, lastBlockNumber] = await Promise.all([
      this.settingModel.findOne(),
      this.getLastBlockHeight(),
    ]);
    let startingBlock, endingBlock;
    do {
      startingBlock = setting.lastBlockHeight - offset;
      endingBlock = Math.min(startingBlock + pageSize, lastBlockNumber);

      const [createdEvents, loanEvents, repayEvents, liquidateEvents] =
        await Promise.all([
          this.getPikachuEvents(
            PikachuContract.address,
            PikachuContract.filters.CreatedPool().topics[0],
            startingBlock,
            endingBlock,
          ),
          this.getPikachuEvents(
            PikachuContract.address,
            PikachuContract.filters.CreatedLoan().topics[0],
            startingBlock,
            endingBlock,
          ),
          this.getPikachuEvents(
            PikachuContract.address,
            PikachuContract.filters.RepayedLoan().topics[0],
            startingBlock,
            endingBlock,
          ),
          this.getPikachuEvents(
            PikachuContract.address,
            PikachuContract.filters.LiquidatedLoan().topics[0],
            startingBlock,
            endingBlock,
          ),
        ]);

      for (let i = 0; i < createdEvents.length; i++) {
        const event = createdEvents[i];
        const owner = `0x${event.raw_log_topics[1].slice(-40)}`;
        const poolId = toInteger(event.raw_log_topics[2]);
        const depositAmount = toFloat(
          ethers.utils.formatEther(event.raw_log_data),
        );
        const blockHeight = event.block_height;

        await this.poolModel.findOneAndUpdate(
          { poolId },
          {
            owner,
            blockHeight,
            txHash: event.tx_hash,
            depositAmount,
            createdAt: new Date(event.block_signed_at),
          },
          { upsert: true },
        );
      }

      for (let i = 0; i < loanEvents.length; i++) {
        const event = loanEvents[i];
        const poolId = toInteger(event[1]);
        // const amount = toFloat(ethers.utils.formatEther(event.raw_log_data));
        const borrower = `0x${event.raw_log_topics[2].slice(-40)}`;
        await this.handleCreateLoanEvent(poolId, borrower, event);
      }

      for (let i = 0; i < repayEvents.length; i++) {
        const event = repayEvents[i];
        const poolId = toInteger(event[1]);
        const borrower = `0x${event.raw_log_topics[2].slice(-40)}`;
        await this.handleRepayEvent(poolId, borrower, event);
      }

      for (let i = 0; i < liquidateEvents.length; i++) {
        const event = liquidateEvents[i];
        const poolId = toInteger(event[1]);
        const borrower = `0x${event.raw_log_topics[2].slice(-40)}`;
        await this.handleLiquidateEvent(poolId, borrower, event);
      }

      setting.lastBlockHeight = endingBlock + 1;
      await setting.save();
    } while (endingBlock < lastBlockNumber);
  }

  async handleCreateLoanEvent(poolId: number, borrower: string, event: Event) {
    const loan = await PikachuContract.loans(poolId, borrower);

    let obj: any = {
      poolId,
      borrower: loan.borrower.toLowerCase(),
      collectionContract: loan.collection.toLowerCase(),
      timestamp: loan.timestamp.toNumber() * 1000,
      amount: toFloat(ethers.utils.formatEther(loan.amount)),
      duration: loan.duration.toNumber(),
      tokenId: loan.tokenId.toNumber(),
      status: loan.status,
      blockNumber: loan.blockNumber.toNumber(),
      interestType: loan.interestType,
      interestStartRate: loan.interestStartRate.toNumber() / 100,
      interestCapRate: loan.interestCapRate.toNumber() / 100,
      txHash: event.tx_hash,
    };
    const loneObj = await this.loanModel.findOneAndUpdate(
      {
        poolId,
        borrower,
        // txHash: event.tx_hash,
      },
      obj,
      {
        sort: {
          blockNumber: -1,
        },
        upsert: true,
        new: true,
      },
    );
    return loneObj;
  }

  async handleRepayEvent(poolId: number, borrower: string, event: Event) {
    const loan = await PikachuContract.loans(poolId, borrower);
    let obj: any = {
      poolId,
      borrower: loan.borrower.toLowerCase(),
      collectionContract: loan.collection.toLowerCase(),
      timestamp: loan.timestamp.toNumber() * 1000,
      amount: toFloat(ethers.utils.formatEther(loan.amount)),
      duration: loan.duration.toNumber(),
      tokenId: loan.tokenId.toNumber(),
      status: loan.status,
      blockNumber: loan.blockNumber.toNumber(),
      interestType: loan.interestType,
      interestStartRate: loan.interestStartRate.toNumber() / 100,
      interestCapRate: loan.interestCapRate.toNumber() / 100,
      repaidAt: new Date(event.block_signed_at),
    };

    const loneObj = await this.loanModel.findOneAndUpdate(
      { poolId, borrower, status: 1 },
      obj,
      {
        sort: {
          blockNumber: 1,
        },
        new: true,
      },
    );
    return loneObj;
  }

  async handleLiquidateEvent(poolId: number, borrower: string, event: Event) {
    const loan = await PikachuContract.loans(poolId, borrower);
    let obj: any = {
      poolId,
      borrower: loan.borrower.toLowerCase(),
      collectionContract: loan.collection.toLowerCase(),
      timestamp: loan.timestamp.toNumber() * 1000,
      amount: toFloat(ethers.utils.formatEther(loan.amount)),
      duration: loan.duration.toNumber(),
      tokenId: loan.tokenId.toNumber(),
      status: loan.status,
      blockNumber: loan.blockNumber.toNumber(),
      interestType: loan.interestType,
      interestStartRate: loan.interestStartRate.toNumber() / 100,
      interestCapRate: loan.interestCapRate.toNumber() / 100,
      repaidAt: new Date(event.block_signed_at),
    };

    const loneObj = await this.loanModel.findOneAndUpdate(
      { poolId, borrower, status: 1 },
      obj,
      {
        sort: {
          blockNumber: 1,
        },
        new: true,
      },
    );
    return loneObj;
  }

  async findAllCollections(verifiedCollections: string[]) {
    return await this.collectionModel
      .find({ contract: { $in: verifiedCollections } })
      .lean()
      .exec();
  }

  async fetchCollections() {
    const [_adminSetting, verifiedCollections] = await Promise.all([
      PikachuContract.adminSetting(),
      PikachuContract.verifiedCollections(),
    ]);

    // const adminSetting = { ..._adminSetting, verifiedCollections };

    for (let collection of verifiedCollections) {
      await this.fetchCollection(collection);
    }
  }

  async fetchCollection(collection: string) {
    const metadata = await alchemy.nft.getContractMetadata(collection);
    try {
      const obj = await this.collectionModel.findOneAndUpdate(
        { contract: collection.toLowerCase() },
        {
          contract: collection.toLowerCase(),
          name: toString(metadata.name),
          symbol: toString(metadata.symbol),
          description: toString(metadata.openSea?.description),
          totalSupply: toInteger(metadata.totalSupply),
          contractDeployer: toString(metadata.contractDeployer),
          deployedBlockNumber: toInteger(metadata.deployedBlockNumber),
          imageUrl: toString(metadata.openSea?.imageUrl),
          externalUrl: toString(metadata.openSea?.externalUrl),
          floorPrice:
            toFloat(metadata.openSea?.floorPrice) + Math.random() * 0.25,
        },
        { upsert: true, new: true },
      );
      return obj;
    } catch (error) {
      console.log(error);
    }
  }

  async getSignature(collection: string): Promise<{
    floorPrice: number;
    signature: string;
    blockNumber: number;
  }> {
    let collectionObj = await this.collectionModel
      .findOne({ contract: collection })
      .exec();

    if (!collectionObj) collectionObj = await this.fetchCollection(collection);

    if (!collectionObj) {
      throw new HttpException(
        'POOL_C:COLLECTION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    const floorPrice = collectionObj.floorPrice;
    const blockNumber = (await ethersProvider.getBlockNumber()) || 0;

    const hash = await PikachuContract.getMessageHash(
      collection,
      ethers.utils.parseEther(floorPrice.toString()),
      blockNumber,
    );

    const signature = await ethersSigner.signMessage(
      ethers.utils.arrayify(hash),
    );

    return {
      floorPrice,
      signature,
      blockNumber,
    };
  }
}
