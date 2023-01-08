import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';
import { Pool, PoolSchema } from './schema/pool.schema';
import { TasksService } from './tasks.service';
console.log(process.env.PIKACHU_NETWORK);
@Module({
  providers: [TasksService, PoolService],
  controllers: [PoolController],
  imports: [
    MongooseModule.forFeature(
      [{ name: Pool.name, schema: PoolSchema }],
      process.env.PIKACHU_NETWORK,
    ),
  ],
})
export class PoolModule {}
