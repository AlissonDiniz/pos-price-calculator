import { v4 as uuidv4 } from 'uuid';
import { posFacadeImpl } from '../../application/facade/impl/pos.facade.impl';

class CalculatePOSPriceFromFileCMD {

  async run(inputFilePath: string) {
    try {
      const command = {
        tid: uuidv4(),
        body: {
          inputFilePath,
        },
      };
      console.log(`${command.tid}:${CalculatePOSPriceFromFileCMD.name} - Calculating POS price for file ${inputFilePath}`);
      await posFacadeImpl.calcPriceFromFile(command);
    } catch(e) {
      process.exit(1);
    }
  }
}

const args = process.argv.slice(2);
const inputArgument = args.find(it => it.indexOf('--input=') > -1);
if (inputArgument) {
  const inputFilePath = inputArgument.split('=')[1];
  new CalculatePOSPriceFromFileCMD().run(inputFilePath);
} else {
  console.log(`
    The argument --input=**Path to input file** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv 
  `);
}