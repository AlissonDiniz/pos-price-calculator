import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { Command } from "../../common/command";
import { Either, left, right } from "../../common/either";
import MathHelper from "../../common/helper/math.helper";
import { POSEvent, POSEventType } from "../domain/pos-event";

export interface CalculatePOSPriceDTO {
  posEventList: POSEvent[];
}

export interface POSPriceMonth {
  id: string,
  price: number,
  yearMonth: Date,
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

  async execute(command: Command<CalculatePOSPriceDTO>): Promise<Either<Error, POSPriceMonth[]>> {
    const { tid, body } = command;
    try {
      const { posEventList } = body;

      console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Calculating POS price`);
      const posMap = this._groupEventByPOS(posEventList);

      const result: POSPriceMonth[] = [];
      Array.from(posMap.entries()).forEach(([key, value]) => {
        const posPriceMonth = this._calcPOSPrice(key, value);
        result.push.apply(result, posPriceMonth);
      });

      return right(result);
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

  _calcPOSPrice(posId: string, eventList: POSEvent[]): POSPriceMonth[] {
    const eventListGroupedByMonth = new Map<string, POSEvent[]>();
    eventList.forEach(it => {
      const monthKey = moment(it.initialDate).format('MM');
      const eventListForMonth = eventListGroupedByMonth.get(monthKey);
      if (eventListForMonth) {
        eventListForMonth.push(it);
      } else {
        eventListGroupedByMonth.set(monthKey, [it]);
      }
    });

    const result: POSPriceMonth[] = Array.from(eventListGroupedByMonth.values()).map(it => {
      const firstEvent = it[0];
      const yearMonth = moment(firstEvent.initialDate).startOf('months').toDate();
      if(it.some(x => x.type === POSEventType.ACTIVATE)) {
        return {
          id: posId,
          price: this._calcPOSPriceForMonth(yearMonth, it),
          yearMonth,
        } as POSPriceMonth; 
      }
      
      return { id: posId, price: 0, yearMonth } as POSPriceMonth; 
    });
    return result;
  }

  _calcPOSPriceForMonth(yearMonth: Date, eventList: POSEvent[]) {
    const firstDate = moment(yearMonth).startOf('months');
    const daysInMonth = moment(yearMonth).daysInMonth();
      
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