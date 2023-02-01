import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PikachuContract } from 'src/helpers/contract.constants';
import {
  CONVALENTQ_KEY,
  ethersProvider,
  ethersSigner,
  PIKACHU_NETWORK,
} from 'src/helpers/provider.constants';
import fetch from 'node-fetch';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import {
  formatEther,
  toFloat,
  toInteger,
  toString,
} from 'src/helpers/string.helpers';
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

  async findAllPools(): Promise<any> {
    return await this.poolModel.find({}).lean().exec();
    // await this.settingModel.create({
    //   lastBlockHeight: 29000000,
    // });
    // return await this.fetchPools();
  }
  async findAllLoans(): Promise<any> {
    return await this.loanModel.find({}).lean().exec();
  }

  async findLoansByPoolId(poolId: number): Promise<Loan[]> {
    return await this.loanModel.find({ poolId }).lean().exec();
  }

  async findLoansByPoolIdAndBorrower(
    poolId: number,
    borrower: string,
  ): Promise<Loan[]> {
    return await this.loanModel
      .find({ poolId, borrower }, {}, { sort: { blockNumber: 1 } })
      .lean()
      .exec();
  }

  async findLoanByPoolIdAndBorrower(
    poolId: number,
    borrower: string,
  ): Promise<Loan> {
    const result = await this.loanModel
      .findOne({ poolId, borrower }, {}, { sort: { blockNumber: -1 } })
      .lean()
      .exec();
    if (!result)
      throw new HttpException('LOAN_C:LOAN_NOT_FOUND', HttpStatus.NOT_FOUND);
    return;
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
        `https://api.covalenthq.com/v1/${PIKACHU_NETWORK.id}/events/topics/${event}/?format=JSON&starting-block=${startingBlock}&ending-block=${endingBlock}&sender-address=${address}&page-number=&key=${CONVALENTQ_KEY}`,
      );

      result = await result.json();
      if (result.error === true) {
        console.log(result.error_code, endingBlock);
        return [];
      }
      return result.data.items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  async getLastBlockHeight(): Promise<number> {
    try {
      let result = await fetch(
        `https://api.covalenthq.com/v1/chains/status/?key=${CONVALENTQ_KEY}`,
      );

      result = await result.json();
      if (result.error === true) {
        console.log('112: error: ', result);
        return 0;
      }

      return result.data.items.find(
        (item) => item.chain_id === PIKACHU_NETWORK.id.toString(),
      ).synced_block_height;
    } catch (error) {
      console.log('126: ', error);
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

      const [
        poolCreationEvents,
        poolUpdateEvents,
        loanCreationEvents,
        loanRepayEvents,
        liquidateEvents,
      ] = await Promise.all([
        this.getPikachuEvents(
          PikachuContract.address,
          PikachuContract.filters.CreatedPool().topics[0],
          startingBlock,
          endingBlock,
        ),
        this.getPikachuEvents(
          PikachuContract.address,
          PikachuContract.filters.UpdatedPool().topics[0],
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

      for (let i = 0; i < poolCreationEvents.length; i++) {
        const event = poolCreationEvents[i];
        const poolId = toInteger(event.raw_log_topics[2]);
        await this.handlePoolUpdateEvent(poolId, event);
      }

      for (let i = 0; i < poolUpdateEvents.length; i++) {
        const event = poolUpdateEvents[i];
        const poolId = toInteger(event.raw_log_topics[2]);
        await this.handlePoolUpdateEvent(poolId, event, false);
      }

      for (let i = 0; i < loanCreationEvents.length; i++) {
        const event = loanCreationEvents[i];
        const poolId = toInteger(event[1]);
        // const amount = toFloat(ethers.utils.formatEther(event.raw_log_data));
        const borrower = `0x${event.raw_log_topics[2].slice(-40)}`;
        await this.handleCreateLoanEvent(poolId, borrower, event);
      }

      for (let i = 0; i < loanRepayEvents.length; i++) {
        const event = loanRepayEvents[i];
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

  async handlePoolUpdateEvent(
    poolId: number,
    event: Event,
    isCreation: boolean = true,
  ) {
    const pool = await PikachuContract.getPoolById(poolId);
    // console.log('pool:', formatEther(pool.depositedAmount));
    const poolObj = await this.poolModel.findOneAndUpdate(
      {
        poolId,
      },
      {
        owner: pool.owner.toLowerCase(),
        paused: pool.paused,
        depositedAmount: formatEther(pool.depositedAmount),
        borrowedAmount: formatEther(pool.borrowedAmount),
        availableAmount: formatEther(pool.availableAmount),
        nftLocked: toInteger(pool.nftLocked),
        totalLiquidations: formatEther(pool.totalLiquidations),
        totalLoans: formatEther(pool.totalLoans),
        totalInterest: formatEther(pool.totalInterest),
        loanToValue: toInteger(pool.loanToValue),
        maxAmount: formatEther(pool.maxAmount),
        interestType: toInteger(pool.interestType),
        interestStartRate: toInteger(pool.interestStartRate),
        interestCapRate: toInteger(pool.interestCapRate),
        maxDuration: toInteger(pool.maxDuration),
        compound: pool.compound,
        collections: pool.collections.map((item) => item.toLowerCase()),

        numberOfLoans: toInteger(pool.numberOfLoans),
        numberOfOpenLoans: toInteger(pool.numberOfOpenLoans),
        numberOfLiquidations: toInteger(pool.numberOfLiquidations),

        depositedAt: toInteger(pool.depositedAt) * 1000,
        updatedAt: toInteger(pool.updatedAt) * 1000,
        lastLoanAt: toInteger(pool.lastLoanAt) * 1000,

        ...(isCreation && {
          blockHeight: event.block_height,
          createdAt: new Date(event.block_signed_at),
          txHash: event.tx_hash,
        }),
      },
      {
        sort: {
          blockNumber: -1,
        },
        upsert: true,
        new: true,
      },
    );
    return poolObj;
  }
  async handleCreateLoanEvent(poolId: number, borrower: string, event: Event) {
    const amount = formatEther(BigNumber.from(event.raw_log_data.slice(0, 66)));
    const collection = `0x${event.raw_log_data.slice(90, 130)}`;
    const tokenId = parseInt(`0x${event.raw_log_data.slice(130, 194)}`);
    const interestType = parseInt(`0x${event.raw_log_data.slice(194, 258)}`);
    const interestStartRate = parseInt(
      `0x${event.raw_log_data.slice(258, 322)}`,
    );
    const interestCapRate = parseInt(`0x${event.raw_log_data.slice(322, 386)}`);
    const duration = parseInt(`0x${event.raw_log_data.slice(386, 450)}`);

    const tokenMetadata = await alchemy.nft.getNftMetadata(collection, tokenId);
    const thumbnail = tokenMetadata.media[0]?.thumbnail;

    const obj: any = {
      poolId,
      borrower,
      collectionContract: collection.toLowerCase(),
      timestamp: new Date(event.block_signed_at),
      amount,
      duration,
      tokenId,
      status: 1, // borrowed
      blockNumber: event.block_height,
      interestType: interestType,
      interestStartRate: interestStartRate / 100,
      interestCapRate: interestCapRate / 100,
      txHash: event.tx_hash,
      thumbnail: thumbnail,
    };

    const loneObj = await this.loanModel.findOneAndUpdate(
      {
        poolId,
        borrower,
        txHash: event.tx_hash,
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
    const obj: any = {
      poolId,
      borrower,
      status: 2,
      repaidAt: new Date(event.block_signed_at),
    };

    const loneObj = await this.loanModel.findOneAndUpdate(
      { poolId, borrower, blockNumber: { $lte: event.block_height } },
      obj,
      {
        sort: {
          blockNumber: -1,
        },
        new: true,
      },
    );
    return loneObj;
  }

  async handleLiquidateEvent(poolId: number, borrower: string, event: Event) {
    const obj: any = {
      poolId,
      borrower,
      status: 3,
      repaidAt: new Date(event.block_signed_at),
    };

    const loneObj = await this.loanModel.findOneAndUpdate(
      { poolId, borrower, blockNumber: { $lte: event.block_height } },
      obj,
      {
        sort: {
          blockNumber: -1,
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

    for (const collection of verifiedCollections) {
      await this.fetchCollection(collection);
    }
  }

  async fetchCollection(collection: string) {
    const metadata = await alchemy.nft.getContractMetadata(collection);
    // console.log(metadata);
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
          floorPrice: toFloat(metadata.openSea?.floorPrice), //+ Math.random() * 35,
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
