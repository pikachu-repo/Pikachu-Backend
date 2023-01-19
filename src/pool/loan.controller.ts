import { Controller, Get, Param } from '@nestjs/common';

import { PoolService } from './pool.service';

@Controller('loans')
export class LoanController {
  constructor(private readonly service: PoolService) {}

  @Get()
  async index() {
    // return await this.service.findAllLoans();
  }

  @Get('borrower/:borrower')
  async getLoansByBorrower(@Param('borrower') borrower: string) {
    return await this.service.findLoansByBorrower(borrower.toLowerCase());
  }

  @Get('pool/:poolId')
  async getLoansByPoolId(@Param('poolId') poolId: number) {
    return await this.service.findLoansByPoolId(poolId);
  }

  @Get(':poolId/:borrower')
  async getLoansByPoolIdAndBorrower(
    @Param('poolId') poolId: number,
    @Param('borrower') borrower: string,
  ) {
    return await this.service.findLoansByPoolIdAndBorrower(
      poolId,
      borrower.toLowerCase(),
    );
  }
}
