import { Command } from "../../common/command";
import { Either } from "../../common/either";

export interface CalculatePOSPriceFromFileDTO {
  inputFilePath: string;
  outputFilePath: string;
  fromDate: Date,
  toDate: Date,
}

export interface POSFacade {

  /**
   * Calculate POS price from file
   */
   calcPriceFromFile(command: Command<CalculatePOSPriceFromFileDTO>): Promise<Either<Error, null>>;
}
