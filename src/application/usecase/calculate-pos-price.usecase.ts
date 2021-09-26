import moment from "moment";
import { Command } from "../../common/command";
import { Either, left, right } from "../../common/either";
import MathHelper from "../../common/helper/math.helper";
import { POSEvent, POSEventType } from "../domain/pos-event";

export interface CalculatePOSPriceDTO {
  posEventList: POSEvent[];
}

export default class CalculatePOSPriceUseCase {

  async execute(command: Command<CalculatePOSPriceDTO>): Promise<Either<Error, null>> {
    const { tid, body } = command;
    try {
      const { posEventList } = body;

      console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Calculating POS price`);
      const posMap = this._groupEventByPOS(posEventList);

      Array.from(posMap.entries()).forEach(([key, value]) => {
        const price = this._calcPOSPrice(value);
        console.log(key, price);
      });

      // const days = Array.from(Array(moment('2021-01').daysInMonth()), (_, i) => i + 1);
      // console.log(days);

      return right(null);
    } catch(e) {
      console.log(`${tid}:${CalculatePOSPriceUseCase.name} - ${e}`);
      return left(e as Error);
    }
  }

  _groupEventByPOS(posEventList: POSEvent[]): Map<string, POSEvent[]> {
    const posMap = new Map<string, POSEvent[]>();
    posEventList.forEach(it => {
      const posEntry = posMap.get(it.id);
      if (posEntry) {
        posEntry.push(it);
      } else {
        posMap.set(it.id, [it] as POSEvent[]);
      }
    });
    return posMap;
  }

  _calcPOSPrice(eventList: POSEvent[]): Number {
    if(eventList.some(it => it.type === POSEventType.ACTIVATE)) {
      const dayMap = new Map<string, { value: number, active: boolean }>();
      const firstDate = moment('2021-01').startOf('months');
      const lastDate = moment('2021-01').endOf('months');
      const daysInMonth = (moment('2021-01').daysInMonth() - 1);

      for (let i = 1; i <= daysInMonth; i++) {
        dayMap.set(firstDate.format('YYYY-MM-DD'), { value: 0, active: false });
        firstDate.add(1, 'days');
      }

      const days = Array.from(dayMap.keys());
      eventList
        .sort((a, b) =>  a.initialDate.getTime() - b.initialDate.getTime())
        .filter(it => it.type === POSEventType.ACTIVATE || it.type === POSEventType.NEW_PRICE)
        .forEach(it => {
          const affectedDays = days.filter(d => moment(d).diff(it.initialDate, 'days') >= 0);
          if (it.type === POSEventType.ACTIVATE) {
            affectedDays.forEach(d => {
              const day = dayMap.get(d);
              if (day) {
                day.value = it.price || 0;
                dayMap.set(d, day);
              }
            });
          } else if (it.type === POSEventType.DEACTIVATE) {
            affectedDays.forEach(d => {
              const day = dayMap.get(d);
              if (day) {
                day.value = 0;
                dayMap.set(d, day);
              }
            });
          } else if (it.type === POSEventType.NEW_PRICE) {
            affectedDays.forEach(d => {
              const day = dayMap.get(d);
              if (day) {
                day.value = it.price || 0;
                dayMap.set(d, day);
              }
            });
          }
        });

      const priceGroup: { base: number, divider: number }[] = [];
      Array.from(dayMap.entries())
        .filter(([k, v]) => v.value > 0)
        .forEach(([k, v]) => {
          const price = priceGroup.find(p => p.base === v.value);
          if (price) {
            price.divider = price.divider + 1;
          } else {
            priceGroup.push({ base: v.value, divider: 1 });
          }
        });

        console.log(priceGroup);

      const calculatedPrice = priceGroup.reduce((total, group) => total + MathHelper.round((group.base / daysInMonth) * group.divider, 2), 0);
      return calculatedPrice;
      // const firstActivation = eventList
      //   .filter(it => it.type === POSEventType.ACTIVATE)
      //   .sort((a, b) =>  a.initialDate.getTime() - b.initialDate.getTime())[0];

      // Array(lastDate.diff(moment(firstActivation.initialDate), 'days')).forEach(d => {
      //   console.log(d);
      // });

      // const days = Array(moment('2021-01').daysInMonth());
      // eventList.filter(it => it.type === POSEventType.ACTIVATE).forEach(it => {
      //   const initialDate = moment(it.initialDate);

      // });

      // const days = Array.from(Array(moment('2021-01').daysInMonth()), (_, i) => `${i + 1}`);

    }
    return 0;
  }
}

export const calculatePOSPriceUseCase = new CalculatePOSPriceUseCase();