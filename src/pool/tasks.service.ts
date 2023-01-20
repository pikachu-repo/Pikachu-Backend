import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PoolService } from './pool.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(private readonly poolService: PoolService) {}

  @Cron('1 * * * * *')
  taskFetchPools() {
    // this.poolService.fetchPools(1000);
  }

  @Cron('3 * * * * *')
  taskFetchCollections() {
    // this.poolService.fetchCollections();
  }
}
