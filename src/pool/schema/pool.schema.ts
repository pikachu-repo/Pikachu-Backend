import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type PoolDocument = Pool & Document;

@Schema({ timestamps: true })
export class Pool {
  @Prop({ required: true })
  poolId: number;

  @Prop({ required: true })
  owner: string;

  @Prop({ default: false })
  paused: boolean;
}

export const PoolSchema = SchemaFactory.createForClass(Pool);
