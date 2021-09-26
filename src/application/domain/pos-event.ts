import moment from "moment";

export enum POSEventType {
  ACTIVATE = 'Ativação',
  DEACTIVATE = 'Desativação',
  PROMOTINAL = 'Período Promocional',
  NEW_PRICE = 'Mudança de Preço',
}

interface POSEventConstructorArgs {
  id: string;
  price: string;
  type: string;
  initialDate: string;
  finalDate: string;
}

export class POSEvent {
  public readonly id: string;
  public readonly price: number | null;
  public readonly type: string;
  public readonly initialDate: Date;
  public readonly finalDate: Date | null;

  private constructor (id: string, price: number | null, type: string, initialDate: Date, finalDate: Date | null) {
    this.id = id;
    this.price = price;
    this.type = type;
    this.initialDate = initialDate;
    this.finalDate = finalDate;
    Object.freeze(this);
  }

  static build(args: POSEventConstructorArgs): POSEvent {
    const price = args.price ? Number(args.price) : null;
    const finalDate = args.finalDate ? moment(args.finalDate, 'DD-MM-YYYY').toDate() : null;
    return new POSEvent(args.id, price, args.type, moment(args.initialDate, 'DD-MM-YYYY').toDate(), finalDate);
  }
}