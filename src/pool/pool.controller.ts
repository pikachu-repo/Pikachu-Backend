import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { PoolService } from './pool.service';

@Controller('pools')
export class PoolController {
  constructor(private readonly service: PoolService) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  @Get('collection/:address')
  async getCollection(@Param('address') address: string) {
    return await this.service.fetchCollection(address);
  }

  @Post('collections')
  async getCollections(
    @Body('verifiedCollections') verifiedCollections: string[],
  ) {
    return await this.service.findAllCollections(verifiedCollections);
  }

  @Get(':poolId/loans')
  async getLoansByPoolId(@Param('poolId') poolId: number) {
    return await this.service.findLoansByPoolId(poolId);
  }
}
