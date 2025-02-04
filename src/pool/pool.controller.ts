import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PoolService } from './pool.service';

@Controller('pools')
export class PoolController {
  constructor(private readonly service: PoolService) {}

  @Get()
  async index() {
    return await this.service.findAllPools();
  }

  @Get('update')
  async updatePools() {
    await Promise.all([
      this.service.fetchPools(100000),
      this.service.fetchCollections(),
    ]);
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

  @Get('signature/:collection')
  async getSignature(@Param('collection') collection: string) {
    return await this.service.getSignature(collection);
  }
}
