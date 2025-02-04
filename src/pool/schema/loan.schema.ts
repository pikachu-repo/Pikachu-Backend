import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ required: true })
  poolId: number;

  @Prop({ required: true, index: true })
  txHash: string;

  @Prop({ required: true })
  lender: string;

  @Prop({ required: true })
  borrower: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  collectionContract: string;

  @Prop({ required: true })
  tokenId: number;

  @Prop({ required: true, default: 0 })
  status: number;

  @Prop({ required: true, default: new Date(0) })
  repaidAt: Date;

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true, default: 0 })
  interestType: number;

  @Prop({ required: true, default: 0 })
  interestStartRate: number;

  @Prop({ required: true, default: 0 })
  interestCapRate: number;

  @Prop()
  thumbnail: string;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
