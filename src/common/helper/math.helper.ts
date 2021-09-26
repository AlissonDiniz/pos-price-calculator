export default class MathHelper {

  static round(num: number, places: number): number {
    const rounder = Number('1'.padEnd(places + 1, '0'));
    return Math.round((num + Number.EPSILON) * rounder) / rounder;
  }

}