import { promises as fs } from 'fs';

export default class FileHelper {

  static BREAK_LINE = '\n';
  static CSV_SEPARATOR = ',';

  static async readCSVFile<T>(inputFilePath: string, parseCallback: (data: string[]) => T): Promise<Array<T>> {
    const fileData = await fs.readFile(inputFilePath, 'utf8');
    return fileData.split(FileHelper.BREAK_LINE).map(it => parseCallback(it.split(FileHelper.CSV_SEPARATOR)));
  }

}