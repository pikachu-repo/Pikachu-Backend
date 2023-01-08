import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PikachuContract } from 'src/helpers/contract.constants';
import { CONVALENTQ_KEY, ethersProvider } from 'src/helpers/provider.constants';
import fetch from 'node-fetch';

@Injectable()
export class PoolService {
  constructor() {}

  async findAll(): Promise<any> {
    const eventsFilter = PikachuContract.filters.CreatedPool();
    return await PikachuContract.queryFilter(
      eventsFilter,
      30036497,
      30036497 + 2000,
    );
    return await ethersProvider.getBlockNumber();
  }

  async getPikachuEvents(
    address: string,
    event: string | string[],
    startingBlock: number,
    endingBlock: number,
  ): Promise<
    {
      block_height: number;
      block_signed_at: string;
      raw_log_data: string;
      raw_log_topics: string[];
      sender_address: string;
      tx_hash: string;
    }[]
  > {
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

  async fetchPools() {
    const createdEvents = await this.getPikachuEvents(
      PikachuContract.address,
      PikachuContract.filters.CreatedPool().topics[0],
      29989699,
      30089699,
    );
  }
}
