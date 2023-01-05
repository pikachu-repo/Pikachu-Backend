import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethersProvider } from 'src/helpers/provider.constants';

@Injectable()
export class PoolService {
  constructor() {}

  async findAll(): Promise<any> {
    return await ethersProvider.getBlockNumber();
  }
}
