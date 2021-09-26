
import { Command } from "../../../common/command";
import { Either, left, right } from "../../../common/either";
import FileHelper from "../../../common/helper/file.helper";
import { POSEvent } from "../../domain/pos-event";
import { calculatePOSPriceUseCase } from "../../usecase/calculate-pos-price.usecase";
import { CalculatePOSPriceFromFileDTO, POSFacade } from "../pos.facade";

export class POSFacadeImpl implements POSFacade {

  async calcPriceFromFile(command: Command<CalculatePOSPriceFromFileDTO>): Promise<Either<Error, null>> {
    const { tid, body } = command;
    try {
      const { inputFilePath } = body;
  
      console.log(`${tid}:${POSFacadeImpl.name} - Calculating POS price for file ${inputFilePath}`);
      if (!inputFilePath) {
        throw Error('Input file path cannot be empty!');
      }
      
      console.log(`${tid}:${POSFacadeImpl.name} - Reading file ${inputFilePath}`);
      const eventList = await FileHelper.readCSVFile<POSEvent>(inputFilePath, (data: string[]) => POSEvent.build({
        id: data[0],
        price: data[1],
        type: data[2],
        initialDate: data[3],
        finalDate: data[4],
      }));

      await calculatePOSPriceUseCase.execute({
        tid,
        body: {
          posEventList: eventList,
        }
      });
      return right(null);
    } catch(e) {
      console.log(`${tid}:${POSFacadeImpl.name} - ${e}`);
      return left(e as Error);
    }
  }

}

export const posFacadeImpl = new POSFacadeImpl();
