const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Carrega somente as funções puras de App.js, sem depender de React/Expo.
const source = fs.readFileSync(path.join(__dirname, '..', 'App.js'), 'utf8');
const core = source.slice(source.indexOf('export const initialState'), source.indexOf('// Hook customizado:'))
  .replace(/export /g, '');
const context = vm.createContext({});
vm.runInContext(core + '\nthis.api = { initialState, nextState, calculate };', context);
const { initialState, nextState } = context.api;
function run(keys) {
  return keys.reduce((state, key) => nextState(state, key), { ...initialState });
}
const cases = [
  ['estado inicial', [], '0'],
  ['adição', ['1','2','+','8','='], '20'],
  ['subtração', ['9','-','4','='], '5'],
  ['multiplicação', ['7','*','6','='], '42'],
  ['divisão', ['8','1','/','9','='], '9'],
  ['resultado negativo', ['3','-','8','='], '-5'],
  ['divisão decimal', ['7','/','2','='], '3.5'],
  ['soma decimal', ['0','.','1','+','0','.','2','='], '0.3'],
  ['decimal no início', ['.','5','*','2','='], '1'],
  ['uma vírgula por número', ['1','.','.','5'], '1.5'],
  ['zeros à esquerda', ['0','0','0','4'], '4'],
  ['limpar toda a conta', ['9','+','8','AC'], '0'],
  ['apagar algarismo', ['1','2','3','BACK'], '12'],
  ['apagar o único algarismo', ['4','BACK'], '0'],
  ['apagar número negativo', ['4','SIGN','BACK'], '0'],
  ['inverter sinal', ['5','SIGN','*','2','='], '-10'],
  ['segundo operando negativo', ['8','+','SIGN','3','='], '5'],
  ['dois negativos', ['5','SIGN','*','SIGN','2','='], '10'],
  ['inverter sinal duas vezes', ['8','SIGN','SIGN'], '8'],
  ['trocar operação pendente', ['8','+','*','2','='], '16'],
  ['sequência da esquerda para direita', ['2','+','3','*','4','='], '20'],
  ['continuar com resultado', ['2','+','3','=','*','4','='], '20'],
  ['digitar após resultado', ['2','+','3','=','7'], '7'],
  ['decimal após resultado', ['2','+','3','=','.', '5'], '0.5'],
  ['igual sem operação', ['6','='], '6'],
  ['igual sem segundo operando', ['6','+','='], '6'],
  ['igual repetido mantém resultado', ['2','+','3','=','='], '5'],
  ['limite de entrada', '1234567890123'.split(''), '123456789012'],
  ['recuperar de divisão por zero', ['8','/','0','=','3','+','4','='], '7'],
  ['recuperar de erro com decimal', ['8','/','0','=','.', '5'], '0.5'],
  ['limpar após erro', ['8','/','0','=','AC'], '0'],
  ['apagar após erro', ['8','/','0','=','BACK'], '0'],
  ['arredondamento de dízima', ['1','/','3','='], '0.333333333333'],
  ['zero como primeiro operando', ['0','*','8','='], '0'],
];
for (const [name, keys, expected] of cases) {
  const state = run(keys);
  assert.equal(state.display, expected, name);
  assert.equal(state.error, null, name + ': não deve gerar erro');
}
const zero = run(['8','/','0','=']);
assert.equal(zero.display, 'Erro');
assert.match(zero.error, /zero/);
const negativeZero = run(['8','/','SIGN','0','=']);
assert.match(negativeZero.error, /zero/);
const overflow = run([...('999999999999'.split('')), '*','9','=']);
assert.match(overflow.error, /limite/);
const cleared = run(['2','+','3','AC']);
assert.equal(cleared.stored, null);
assert.equal(cleared.operator, null);
assert.equal(cleared.expression, '');
assert.equal(run(['2','+','3','=']).expression, '2 + 3 =');
assert.equal(run(['8','+','BACK','2','=']).display, '10');
console.log((cases.length + 6) + ' testes passaram.');
