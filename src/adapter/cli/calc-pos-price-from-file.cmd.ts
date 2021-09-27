import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { posFacadeImpl } from '../../application/facade/impl/pos.facade.impl';

class CalculatePOSPriceFromFileCMD {

  async run(inputFilePath: string, outputFilePath: string, from: string, to: string) {
    try {
      const command = {
        tid: uuidv4(),
        body: {
          inputFilePath,
          outputFilePath,
          fromDate: moment.utc(from).toDate(),
          toDate: moment.utc(to).toDate()
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
const fromArgument = args.find(it => it.indexOf('--from=') > -1);
const toArgument = args.find(it => it.indexOf('--to=') > -1);

if (!inputArgument) {
  console.log(`
    The argument --input=**Path to input file** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv --output=faturamentos.csv --from=2021-01-01 --to=2021-01-31
  `);
} else if (!outputArgument) {
  console.log(`
    The argument --ouput=**Path to output file** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv --output=faturamentos.csv --from=2021-01-01 --to=2021-01-31
  `);
} else if (!fromArgument) {
  console.log(`
    The argument --from=**Date to start the calc** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv --output=faturamentos.csv --from=2021-01-01 --to=2021-01-31
  `);
} else if (!toArgument) {
  console.log(`
    The argument --to=**Date to end the calc** cannot be found

    For running the calc pos price command use the example bellow:
    node build/src/adapter/cli/calc-pos-price-from-file.cmd.js --input=./events.csv --output=faturamentos.csv --from=2021-01-01 --to=2021-01-31
  `);
}

if (inputArgument && outputArgument && fromArgument && toArgument) {
  const inputFilePath = inputArgument.split('=')[1];
  const outputFilePath = outputArgument.split('=')[1];
  const from = fromArgument.split('=')[1];
  const to = toArgument.split('=')[1];
  new CalculatePOSPriceFromFileCMD().run(inputFilePath, outputFilePath, from, to);
}