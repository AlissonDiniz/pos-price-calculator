import { promises as fs } from 'fs';

export default class FileHelper {

  static BREAK_LINE = '\n';
  static CSV_SEPARATOR = ',';

  static async readCSVFile<T>(inputFilePath: string, parseCallback: (data: string[]) => T): Promise<Array<T>> {
    const fileData = await fs.readFile(inputFilePath, 'utf8');
    return fileData.split(FileHelper.BREAK_LINE).map(it => parseCallback(it.split(FileHelper.CSV_SEPARATOR)));
  }

  static async writeCSVFile(outputFilePath: string, data: Array<Array<string>>): Promise<void> {
    const fileData = data.map(it => it.join(FileHelper.CSV_SEPARATOR)).join(FileHelper.BREAK_LINE);
    await fs.writeFile(outputFilePath, fileData);
  }


}