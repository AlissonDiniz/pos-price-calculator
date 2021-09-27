import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { Command } from "../../common/command";
import { Either, left, right } from "../../common/either";
import MathHelper from "../../common/helper/math.helper";
import { POSEvent, POSEventType } from "../domain/pos-event";

export interface CalculatePOSPriceDTO {
  posEventList: POSEvent[];
}

interface POSEventEntry {
  key: string,
  event: POSEvent,
  priceForDay: number
}

interface POSDayEvent {
  price: number,
  active: boolean,
  promo: boolean,
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
      const firstDate = moment('2021-01').startOf('months');
      const lastDate = moment('2021-01').endOf('months');
      const daysInMonth = (moment('2021-01').daysInMonth() - 1);
      
      const dayMap = new Map<string, POSDayEvent>();
      for (let i = 1; i <= daysInMonth; i++) {
        dayMap.set(firstDate.format('YYYY-MM-DD'), { price: 0, active: false, promo: false } as POSDayEvent);
        firstDate.add(1, 'days');
      }

      const eventListMap = new Map<string, POSEventEntry>();
      eventList.forEach(it => {
        const key = uuidv4();
        eventListMap.set(key, { key, event: it, priceForDay: it.price ? (it.price / daysInMonth) : 0 });
      });

      Array.from(eventListMap.values())
        .sort((a, b) => a.event.initialDate.getTime() - b.event.initialDate.getTime())
        .forEach(v => this._applyEvent(dayMap, eventListMap, v));

      const price = Array.from(dayMap.values()).filter(it => it.active).reduce((total, day) => total + day.price, 0);
      return MathHelper.round(price, 2);
    }
    return 0;
  }

  _applyEvent(dayMap: Map<string, POSDayEvent>, eventListMap: Map<string, POSEventEntry>, posEventEntry: POSEventEntry) {
    const days = Array.from(dayMap.keys());
    const { key, event, priceForDay } = posEventEntry;
    const filteredDays = (event.type === POSEventType.PROMOTINAL) ? 
      days.filter(d => moment(d).diff(event.initialDate, 'days') >= 0 && moment(d).diff(event.finalDate, 'days') <= 0)
      :
      days.filter(d => moment(d).diff(event.initialDate, 'days') >= 0);

    if (event.type === POSEventType.ACTIVATE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.price = priceForDay;
          day.active = true;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.DEACTIVATE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.active = false;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.NEW_PRICE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day && !day.promo) {
          day.price = priceForDay;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.PROMOTINAL) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.price = priceForDay;
          day.promo = true;
          dayMap.set(d, day);
        }
      });
    }
  }
}

export const calculatePOSPriceUseCase = new CalculatePOSPriceUseCase();