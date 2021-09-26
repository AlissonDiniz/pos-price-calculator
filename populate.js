const fs = require('fs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const Chance = require('chance');

const chance = new Chance();

const posEventMap = [];
for (let i = 0; i < 20; i++) {
  posEventMap[uuidv4()] = [];
}

const format = (date) => {
  return moment(date).format('YYYY-MM-DD');
};

Object.keys(posEventMap).forEach(pos => {
  const posEvent = posEventMap[pos];
  let initialPrice = chance.floating({ min: 2, max: 50, fixed: 2 });
  if (chance.integer({ min: 333, max: 999 }) % 12 === 0) {
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
    posEvent.push([pos, '', 'Desativação', format(`2021-01-${chance.integer({ min: 11, max: 31 })}`), '']);
  } else if (chance.integer({ min: 333, max: 999 }) % 13 === 0) {
    initialPrice = chance.floating({ min: 2, max: 40, fixed: 2 });
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
    
    const changePrice = chance.floating({ min: (initialPrice + 1), max: 50, fixed: 2 });
    posEvent.push([pos, changePrice, 'Mudança de Preço', format(`2021-01-${chance.integer({ min: 11, max: 31 })}`), '']);
  } else if (chance.integer({ min: 333, max: 999 }) % 14 === 0) {
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
    
    const promoPrice = chance.floating({ min: 0, max: (initialPrice - 1), fixed: 2 });
    posEvent.push([pos, promoPrice, 'Período Promocional', format(`2021-01-${chance.integer({ min: 11, max: 16 })}`), format(`2021-01-${chance.integer({ min: 20, max: 31 })}`)]);
  } else if (chance.integer({ min: 333, max: 999 }) % 15 === 0) {
    initialPrice = chance.floating({ min: 2, max: 40, fixed: 2 });
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
    
    const promoPrice = chance.floating({ min: 0, max: (initialPrice - 1), fixed: 2 });
    posEvent.push([pos, promoPrice, 'Período Promocional', format(`2021-01-${chance.integer({ min: 11, max: 16 })}`), format(`2021-01-${chance.integer({ min: 20, max: 28 })}`)]);

    const changePrice = chance.floating({ min: (initialPrice + 1), max: 50, fixed: 2 });
    posEvent.push([pos, changePrice, 'Mudança de Preço', format(`2021-01-${chance.integer({ min: 18, max: 20 })}`), '']);
  } else if (chance.integer({ min: 333, max: 999 }) % 15 === 0) {
    const promoPrice = chance.floating({ min: 0, max: (initialPrice - 1), fixed: 2 });
    posEvent.push([pos, promoPrice, 'Período Promocional', format(`2021-01-${chance.integer({ min: 11, max: 16 })}`), format(`2021-01-${chance.integer({ min: 20, max: 28 })}`)]);

    const changePrice = chance.floating({ min: (initialPrice + 1), max: 50, fixed: 2 });
    posEvent.push([pos, changePrice, 'Mudança de Preço', format(`2021-01-${chance.integer({ min: 18, max: 20 })}`), '']);
  } else if (chance.integer({ min: 333, max: 999 }) % 16 === 0) {
    initialPrice = chance.floating({ min: 2, max: 40, fixed: 2 });
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
    posEvent.push([pos, '', 'Desativação', format(`2021-01-${chance.integer({ min: 11, max: 15 })}`), '']);
    
    const promoPrice = chance.floating({ min: 0, max: (initialPrice - 1), fixed: 2 });
    posEvent.push([pos, promoPrice, 'Período Promocional', format(`2021-01-${chance.integer({ min: 10, max: 14 })}`), format(`2021-01-${chance.integer({ min: 18, max: 20 })}`)]);

    const changePrice = chance.floating({ min: (initialPrice + 1), max: 50, fixed: 2 });
    posEvent.push([pos, changePrice, 'Mudança de Preço', format(`2021-01-${chance.integer({ min: 16, max: 18 })}`), '']);
  
    const newPrice = chance.floating({ min: (initialPrice + 1), max: 50, fixed: 2 });
    posEvent.push([pos, newPrice, 'Ativação', format(`2021-01-${chance.integer({ min: 20, max: 24 })}`), '']);
  } else {
    posEvent.push([pos, initialPrice, 'Ativação', format(`2021-01-0${chance.integer({ min: 1, max: 9 })}`), '']);
  }
  posEventMap[pos] = [...posEvent];
});

fs.writeFileSync("eventos.csv", Object.values(posEventMap).reduce((all, it) => ([...all, ...it]), []).map(it => it.join(',')).join('\n'));
