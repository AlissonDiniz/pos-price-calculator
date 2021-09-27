import { v4 as uuidv4 } from 'uuid';
import { posFacadeImpl } from '../../application/facade/impl/pos.facade.impl';

class CalculatePOSPriceFromFileCMD {

  async run(inputFilePath: string, outputFilePath: string) {
    try {
      const command = {
        tid: uuidv4(),
        body: {
          inputFilePath,
          outputFilePath,
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
const outputArgument = args.find(it => it.indexOf('--output=') > -1);
if (inputArgument && outputArgument) {
  const inputFilePath = inputArgument.split('=')[1];
  const outputFilePath = outputArgument.split('=')[1];
  new CalculatePOSPriceFromFileCMD().run(inputFilePath, outputFilePath);
} else {
  console.log(`
    The argument --input=**Path to input file** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv --output=faturamentos.csv
  `);
}