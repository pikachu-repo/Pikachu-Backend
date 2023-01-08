import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';
import { Pool } from './pool.schema';

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ required: true })
  poolId: number;

  @Prop({ required: true })
  lender: string;

  @Prop({ required: true })
  borrower: string;

  @Prop({ required: true })
  collection: string;

  @Prop({ required: true })
  tokenId: number;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
