import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, MD3LightTheme, PaperProvider, Surface, Text } from 'react-native-paper';

// Lógica pura: permite testar as contas sem abrir a interface.
export const initialState = {
  display: '0', stored: null, operator: null, waiting: false,
  justEvaluated: false, expression: '', error: null,
};
const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const formatDisplay = (value) => String(value).replace('.', ',');

export function calculate(left, right, operator) {
  if (operator === '/' && right === 0) {
    return { error: 'Não é possível dividir por zero.' };
  }
  let result;
  switch (operator) {
    case '+': result = left + right; break;
    case '-': result = left - right; break;
    case '*': result = left * right; break;
    case '/': result = left / right; break;
    default: return { error: 'Operação inválida.' };
  }
  if (!Number.isFinite(result) || Math.abs(result) > 999999999999) {
    return { error: 'Resultado fora do limite de 12 algarismos.' };
  }
  // Evita resíduos como 0,30000000000000004 nas contas comuns.
  const rounded = Number(result.toPrecision(12));
  return { display: String(Object.is(rounded, -0) ? 0 : rounded) };
}
function calculationError(message) {
  return { ...initialState, display: 'Erro', error: message };
}

export function nextState(current, key) {
  if (key === 'AC') return { ...initialState };
  let state = current;
  // Digitar um número depois de um erro começa uma conta nova.
  if (state.error) {
    if (/^\d$/.test(key) || key === '.') state = { ...initialState };
    else if (key === 'BACK') return { ...initialState };
    else return state;
  }
  if (/^\d$/.test(key)) {
    const fresh = state.waiting || state.justEvaluated;
    let display = fresh ? key : state.display;
    if (!fresh) {
      if (display === '0') display = key;
      else if (display === '-0') display = key === '0' ? '-0' : '-' + key;
      else display += key;
    }
    if (display.replace(/[^0-9]/g, '').length > 12) return state;
    return {
      ...state, display, waiting: false, justEvaluated: false,
      expression: state.justEvaluated ? '' : state.expression,
    };
  }
  if (key === '.') {
    const fresh = state.waiting || state.justEvaluated;
    if (!fresh && state.display.includes('.')) return state;
    return {
      ...state, display: fresh ? '0.' : state.display + '.',
      waiting: false, justEvaluated: false,
      expression: state.justEvaluated ? '' : state.expression,
    };
  }
  if (key === 'BACK') {
    if (state.justEvaluated) return { ...initialState };
    if (state.waiting) return state;
    const display = state.display.slice(0, -1);
    return { ...state, display: display === '' || display === '-' ? '0' : display };
  }
  if (key === 'SIGN') {
    const value = state.waiting ? '0' : state.display;
    const display = value.startsWith('-') ? value.slice(1) : '-' + value;
    return {
      ...state, display, waiting: false,
      expression: state.justEvaluated ? '' : state.expression,
    };
  }
  if (Object.prototype.hasOwnProperty.call(symbols, key)) {
    let display = state.display;
    // Outro operador antes do segundo número apenas troca a operação.
    if (state.operator && !state.waiting) {
      const result = calculate(state.stored, Number(display), state.operator);
      if (result.error) return calculationError(result.error);
      display = result.display;
    }
    return {
      ...state, display, stored: Number(display), operator: key,
      waiting: true, justEvaluated: false,
      expression: formatDisplay(display) + ' ' + symbols[key],
    };
  }
  if (key === '=') {
    if (!state.operator || state.waiting) return state;
    const result = calculate(state.stored, Number(state.display), state.operator);
    if (result.error) return calculationError(result.error);
    return {
      ...initialState, display: result.display, justEvaluated: true,
      expression: formatDisplay(state.stored) + ' ' + symbols[state.operator]
        + ' ' + formatDisplay(state.display) + ' =',
    };
  }
  return state;
}

// Hook customizado: useState preserva os valores entre renderizações.
function useCalculator() {
  const [state, setState] = useState({ ...initialState });
  function press(key) {
    setState((previous) => nextState(previous, key));
  }
  return { state, press };
}

const palette = {
  background: '#F4F3EF', card: '#FFFFFF', ink: '#20231F',
  muted: '#71766F', accent: '#32634B', accentLight: '#E5EEE7',
  number: '#F3F4F0', utility: '#ECEDE8', error: '#BA1A1A',
};
const theme = {
  ...MD3LightTheme, roundness: 5,
  colors: {
    ...MD3LightTheme.colors, primary: palette.accent,
    background: palette.background, surface: palette.card, onSurface: palette.ink,
  },
};

// Botão reutilizável: recebe rótulo, aparência e ação por props.
function CalculatorButton({ label, value, kind = 'number', wide = false, selected, onPress }) {
  const isEqual = kind === 'equal';
  const isOperator = kind === 'operator';
  const background = isEqual || selected ? palette.accent
    : isOperator ? palette.accentLight
    : kind === 'utility' ? palette.utility : palette.number;
  const textColor = isEqual || selected ? '#FFFFFF'
    : isOperator ? palette.accent : palette.ink;
  const names = {
    AC: 'Limpar tudo', BACK: 'Apagar último algarismo', SIGN: 'Inverter sinal',
    '/': 'Dividir', '*': 'Multiplicar', '-': 'Subtrair', '+': 'Somar',
    '=': 'Calcular resultado', '.': 'Vírgula decimal',
  };
  return (
    <View style={[styles.keySlot, wide && styles.wideKey]}>
      <Button
        mode="contained" buttonColor={background} textColor={textColor}
        onPress={() => onPress(value)}
        accessibilityLabel={names[value] || 'Número ' + value}
        testID={'key-' + value} compact
        style={styles.key} contentStyle={styles.keyContent}
        labelStyle={[styles.keyLabel, kind === 'utility' && styles.utilityLabel]}
      >
        {label}
      </Button>
    </View>
  );
}

function CalculatorDisplay({ state }) {
  const value = formatDisplay(state.display);
  return (
    <Surface elevation={0} style={styles.display}>
      <Text style={styles.displayCaption}>VISOR</Text>
      <Text style={styles.expression} numberOfLines={1} testID="expression">
        {state.expression || 'Vamos calcular?'}
      </Text>
      <Text
        style={[styles.result, state.error && styles.errorResult]}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.35}
        accessibilityLiveRegion="polite" accessibilityLabel={'Resultado: ' + value}
        testID="result"
      >
        {value}
      </Text>
      <Text
        style={[styles.hint, state.error && styles.errorHint]}
        accessibilityLiveRegion="polite" testID="feedback"
      >
        {state.error || 'Selecione os números e uma operação.'}
      </Text>
    </Surface>
  );
}

const rows = [
  [
    { label: 'AC', value: 'AC', kind: 'utility' },
    { label: '⌫', value: 'BACK', kind: 'utility' },
    { label: '+/−', value: 'SIGN', kind: 'utility' },
    { label: '÷', value: '/', kind: 'operator' },
  ],
  [
    { label: '7', value: '7' }, { label: '8', value: '8' },
    { label: '9', value: '9' }, { label: '×', value: '*', kind: 'operator' },
  ],
  [
    { label: '4', value: '4' }, { label: '5', value: '5' },
    { label: '6', value: '6' }, { label: '−', value: '-', kind: 'operator' },
  ],
  [
    { label: '1', value: '1' }, { label: '2', value: '2' },
    { label: '3', value: '3' }, { label: '+', value: '+', kind: 'operator' },
  ],
  [
    { label: '0', value: '0', wide: true },
    { label: ',', value: '.' }, { label: '=', value: '=', kind: 'equal' },
  ],
];

function CalculatorScreen() {
  const { state, press } = useCalculator();
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>SOLUÇÕES MOBILE</Text>
              <Text variant="headlineMedium" style={styles.title}>Calculadora</Text>
            </View>
            <View style={styles.badge}><Text style={styles.badgeLabel}>EXPO</Text></View>
          </View>
          <Text style={styles.intro}>Uma conta de cada vez.</Text>
          <Surface elevation={1} style={styles.calculator}>
            <CalculatorDisplay state={state} />
            <View style={styles.keyboard}>
              {rows.map((row, index) => (
                <View key={index} style={styles.row}>
                  {row.map((button) => (
                    <CalculatorButton
                      key={button.value} {...button}
                      selected={state.waiting && state.operator === button.value}
                      onPress={press}
                    />
                  ))}
                </View>
              ))}
            </View>
          </Surface>
          <View style={styles.footer}>
            <View style={styles.dot} />
            <Text style={styles.footerText}>Somar, subtrair, multiplicar e dividir.</Text>
          </View>
          <Text style={styles.note}>AC limpa tudo · ⌫ apaga um algarismo · +/− troca o sinal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}><CalculatorScreen /></PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  page: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: palette.muted },
  title: { fontWeight: '700', letterSpacing: -1, color: palette.ink, marginTop: 4 },
  badge: { backgroundColor: palette.accentLight, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  badgeLabel: { color: palette.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  intro: { color: palette.muted, fontSize: 14, marginTop: 8, marginBottom: 24 },
  calculator: { backgroundColor: palette.card, borderRadius: 24, padding: 16, overflow: 'hidden' },
  display: { backgroundColor: palette.card, padding: 8, paddingTop: 6, paddingBottom: 18 },
  displayCaption: { color: palette.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  expression: { color: palette.muted, fontSize: 16, textAlign: 'right', marginTop: 14, minHeight: 24 },
  result: { color: palette.ink, fontSize: 58, lineHeight: 72, textAlign: 'right', fontWeight: '500', letterSpacing: -2 },
  hint: { color: palette.muted, fontSize: 11, textAlign: 'right', minHeight: 32, marginTop: 4 },
  errorResult: { color: palette.error, fontSize: 42 },
  errorHint: { color: palette.error },
  keyboard: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  keySlot: { flex: 1 },
  wideKey: { flex: 2, marginRight: 8 },
  key: { minWidth: 0, borderRadius: 14 },
  keyContent: { height: 64 },
  keyLabel: { fontSize: 26, lineHeight: 32, fontWeight: '500', marginHorizontal: 0, marginVertical: 0 },
  utilityLabel: { fontSize: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent },
  footerText: { color: palette.muted, fontSize: 12 },
  note: { color: palette.muted, fontSize: 10, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
