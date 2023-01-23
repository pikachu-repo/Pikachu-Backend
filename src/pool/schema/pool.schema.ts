import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type PoolDocument = Pool & Document;

@Schema()
export class Pool {
  @Prop({ required: true, index: true })
  poolId: number;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true, default: false })
  paused: boolean;

  @Prop({ required: true, default: 0 })
  depositedAmount: number;

  @Prop({ required: true, default: 0 })
  borrowedAmount: number;

  @Prop({ required: true, default: 0 })
  availableAmount: number;

  @Prop({ required: true, default: 0 })
  nftLocked: number;

  @Prop({ required: true, default: 0 })
  totalLiquidations: number;

  @Prop({ required: true, default: 0 })
  totalLoans: number;

  @Prop({ required: true, default: 0 })
  totalInterest: number;

  @Prop({ required: true, default: 0 })
  depositedAt: number;

  @Prop({ required: true, default: 0 })
  updatedAt: number;

  @Prop({ required: true, default: 0 })
  lastLoanAt: number;

  @Prop({ required: true, default: 0 })
  loanToValue: number;

  @Prop({ required: true, default: 0 })
  maxAmount: number;

  @Prop({ required: true, default: 0 })
  interestType: number;

  @Prop({ required: true, default: 0 })
  interestStartRate: number;

  @Prop({ required: true, default: 0 })
  interestCapRate: number;

  @Prop({ required: true, default: 0 })
  maxDuration: number;

  @Prop({ required: true, default: false })
  compound: boolean;

  @Prop({ required: true, default: [] })
  collections: string[];

  @Prop({ required: true, default: 0 })
  numberOfLoans: number;

  @Prop({ required: true, default: 0 })
  numberOfOpenLoans: number;

  @Prop({ required: true, default: 0 })
  numberOfLiquidations: number;

  // pool creation information
  @Prop({ required: true, default: 0 })
  blockHeight: number;

  @Prop({ required: true, default: new Date(0) })
  createdAt: Date;

  @Prop({ required: true, index: true })
  txHash: string;
}

export const PoolSchema = SchemaFactory.createForClass(Pool);
