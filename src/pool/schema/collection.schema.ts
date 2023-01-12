import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CollectionDocument = Collection & Document;

@Schema({ timestamps: true })
export class Collection {
  @Prop({ required: true, index: true })
  contract: string;

  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  symbol: string;

  @Prop()
  imageUrl: string;

  @Prop()
  externalUrl: string;
  @Prop()
  description: string;

  @Prop({ required: true, default: 0 })
  totalSupply: number;

  @Prop({ required: true, default: 0 })
  floorPrice: number;

  @Prop()
  contractDeployer: string;

  @Prop()
  deployedBlockNumber: number;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
