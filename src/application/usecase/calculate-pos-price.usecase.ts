import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { Command } from "../../common/command";
import { Either, left, right } from "../../common/either";
import MathHelper from "../../common/helper/math.helper";
import { POSEvent, POSEventType } from "../domain/pos-event";

export interface CalculatePOSPriceDTO {
  posEventList: POSEvent[];
  fromDate: Date,
  toDate: Date,
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
  day: string,
  eventKey: string,
  price: number,
  active: boolean,
  promo: boolean,
}

interface POSMonthResult {
  price: number,
  eventPrice: number,
  active: boolean,
}

interface POSState {
  id: string,
  active: boolean, 
  eventPrice: number,
  eventList: POSEvent[],
}

export default class CalculatePOSPriceUseCase {

  async execute(command: Command<CalculatePOSPriceDTO>): Promise<Either<Error, POSPriceMonth[]>> {
    const { tid, body } = command;
  
    try {
      const { posEventList, fromDate, toDate } = body;

      console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Calculating POS price`);
      const posMap = this._groupEventByPOS(tid, posEventList);

      const result: POSPriceMonth[] = [];
      Array.from(posMap.values()).forEach(it => {
        const posPriceMonth = this._calcPOSPrice(tid, it, fromDate, toDate);
        result.push.apply(result, posPriceMonth);
      });

      return right(result);
    } catch(e) {
      console.log(`${tid}:${CalculatePOSPriceUseCase.name} - ${e}`);
      return left(e as Error);
    }
  }

  _groupEventByPOS(tid: string, posEventList: POSEvent[]): Map<string, POSState> {
    console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Grouping Events BY POS`);
    const posMap = new Map<string, POSState>();
    posEventList.forEach(it => {
      const posEntry = posMap.get(it.id);
      if (posEntry) {
        posEntry.eventList.push(it);
      } else {
        posMap.set(it.id, { id: it.id, active: false, eventPrice: 0, eventList: [it] as POSEvent[]} as POSState);
      }
    });
    return posMap;
  }

  _calcPOSPrice(tid: string, posState: POSState, fromDate: Date, toDate: Date): POSPriceMonth[] {
    console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Calculating POS Price: ${posState.id}`);
    const eventListGroupedByMonth = new Map<string, POSEvent[]>();
    const firstDate = moment.utc(fromDate);
    eventListGroupedByMonth.set(firstDate.format('YYYY-MM'), []);

    for(let i = 0; i < moment.utc(toDate).diff(firstDate, 'months'); i++) {
      eventListGroupedByMonth.set(firstDate.add((i + 1), 'months').format('YYYY-MM'), []);
    }

    posState.eventList.forEach(it => {
      const yearMonthKey = moment.utc(it.initialDate).format('YYYY-MM');
      const eventListForMonth = eventListGroupedByMonth.get(yearMonthKey);
      if (eventListForMonth) {
        eventListForMonth.push(it);
      } else {
        eventListGroupedByMonth.set(yearMonthKey, [it]);
      }
    });

    const result: POSPriceMonth[] = Array.from(eventListGroupedByMonth.entries())
      .sort((a, b) => b[0] > a[0] ? -1 : a[0] > b[0] ? 1 : 0)
      .map(([k, v]) => {
        const yearMonth = moment.utc(k).toDate();
        const eventList = v;
        if(posState.active || eventList.some(x => x.type === POSEventType.ACTIVATE)) {
          const posPriceResult = this._calcPOSPriceForMonth(tid, posState, yearMonth, eventList);
          posState.active = posPriceResult.active;
          posState.eventPrice = posPriceResult.eventPrice;

          return {
            id: posState.id,
            price: posPriceResult.price,
            yearMonth,
          } as POSPriceMonth; 
        }
        
        return { id: posState.id, price: 0, yearMonth } as POSPriceMonth; 
      });
    return result;
  }

  _calcPOSPriceForMonth(tid: string, posState: POSState, yearMonth: Date, eventList: POSEvent[]): POSMonthResult {
    console.log(`${tid}:${CalculatePOSPriceUseCase.name} - Calculating POS Price for Month: ${moment.utc(yearMonth)}`);
    if (!eventList.length) {
      return { price: posState.eventPrice, active: posState.active, eventPrice: posState.eventPrice } as POSMonthResult;
    }
  
    const firstDate = moment.utc(yearMonth).startOf('months');
    const daysInMonth = moment.utc(yearMonth).daysInMonth();
    
    const dayMap = new Map<string, POSDayEvent>();
    const initialPriceForDay = posState.eventPrice ? (posState.eventPrice / daysInMonth) : 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const day = firstDate.format('YYYY-MM-DD');
      dayMap.set(day, { day, eventKey: '', price: initialPriceForDay, active: posState.active, promo: false } as POSDayEvent);
      firstDate.add(1, 'days');
    }

    const eventListMap = new Map<string, POSEventEntry>();
    eventList.forEach(it => {
      const key = uuidv4();
      eventListMap.set(key, { key, event: it, priceForDay: it.price ? (it.price / daysInMonth) : 0 });
    });

    Array.from(eventListMap.values())
      .sort((a, b) => a.event.initialDate.getTime() - b.event.initialDate.getTime())
      .forEach(v => this._applyEvent(dayMap, v));

    const price = Array.from(dayMap.values()).filter(it => it.active).reduce((total, day) => total + day.price, 0);

    const dayArray = Array.from(dayMap.values())
      .sort((a, b) => b.day > a.day ? -1 : a.day > b.day ? 1 : 0);
    const lastDay = dayArray[dayArray.length - 1];
    const lastDayPOSEvent = eventListMap.get(lastDay.eventKey);

    return { price: MathHelper.round(price, 2), active: lastDay.active, eventPrice: lastDayPOSEvent ? lastDayPOSEvent.event.price : 0 } as POSMonthResult;
  }

  _applyEvent(dayMap: Map<string, POSDayEvent>, posEventEntry: POSEventEntry) {
    const days = Array.from(dayMap.keys());
    const { key, event, priceForDay } = posEventEntry;
    const filteredDays = (event.type === POSEventType.PROMOTINAL) ? 
      days.filter(d => moment.utc(d).diff(event.initialDate, 'days') >= 0 && moment.utc(d).diff(event.finalDate, 'days') <= 0)
      :
      days.filter(d => moment.utc(d).diff(event.initialDate, 'days') >= 0);

    if (event.type === POSEventType.ACTIVATE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.eventKey = key;
          day.price = priceForDay;
          day.active = true;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.DEACTIVATE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.eventKey = key;
          day.active = false;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.NEW_PRICE) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day && !day.promo) {
          day.eventKey = key;
          day.price = priceForDay;
          dayMap.set(d, day);
        }
      });
    } else if (event.type === POSEventType.PROMOTINAL) {
      filteredDays.forEach(d => {
        const day = dayMap.get(d);
        if (day) {
          day.eventKey = key;
          day.price = priceForDay;
          day.promo = true;
          dayMap.set(d, day);
        }
      });
    }
  }
}

export const calculatePOSPriceUseCase = new CalculatePOSPriceUseCase();