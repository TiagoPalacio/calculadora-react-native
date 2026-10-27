# Calculadora com React Native e Expo

Aplicativo desenvolvido para o exercício de Soluções Mobile da UNISATC. Usa componentes funcionais, Hooks e React Native Paper.

## Funcionalidades

- Adição, subtração, multiplicação e divisão.
- Visor com número atual e operação realizada.
- Entrada decimal com vírgula na interface.
- AC para limpar, ⌫ para apagar e +/− para inverter o sinal.
- Tratamento de divisão por zero e limite numérico.
- Componentes reutilizáveis e rótulos de acessibilidade.

## Estrutura

- App.js: componentes, tema, Hook useCalculator e funções da calculadora.
- index.js: registro do aplicativo no Expo.
- app.json: configurações do aplicativo.
- package.json: dependências e comandos.
- tests/calculator.test.cjs: testes das operações e sequências de entrada.

## Executar sem terminal

1. Abra https://snack.expo.dev/ e selecione Expo SDK 54.
2. Substitua o conteúdo de App.js pelo arquivo deste repositório.
3. No package.json do Snack, use:

```json
{
  "dependencies": {
    "react-native-paper": "5.14.5",
    "react-native-safe-area-context": "~5.6.0",
    "@expo/vector-icons": "^15.0.3"
  }
}
```

4. Aguarde as dependências e abra a aba Web.

Essa configuração simplificada é somente para o Snack. Para executar o projeto localmente, mantenha o package.json completo deste repositório.

## Executar localmente

Com Node.js compatível com Expo SDK 54 instalado, execute na pasta do projeto:

```sh
npm install
npm start
```

Para abrir a versão Web, use npm run web. Para executar os testes:

```sh
npm test
```

## Componentes e estado

PaperProvider fornece o tema. CalculatorScreen organiza a tela, CalculatorButton recebe rótulos e ações por props, e CalculatorDisplay apresenta o visor. O Hook useCalculator utiliza useState e atualização funcional para preservar e atualizar o estado. A lógica de cálculo não utiliza eval.

As operações são resolvidas na ordem de entrada: 2 + 3 × 4 = 20. Repetir = mantém o resultado. Digitar um número após o resultado inicia uma nova entrada; escolher um operador continua a conta.

A entrada aceita até 12 algarismos, e os resultados usam até 12 algarismos significativos. Valores muito pequenos podem aparecer em notação científica.

## Validação

A versão preparada passou em 40 testes de lógica. Também foi conferida na prévia Web do Expo Snack: 7 × 6 = 42, 0,1 + 0,2 = 0,3 e mensagem de divisão por zero. Não foi gerado APK nem realizada execução em Android/iOS físico.

## Referências

- Expo: https://docs.expo.dev/
- React Native Paper: https://oss.callstack.com/react-native-paper/docs/guides/getting-started
- useState: https://react.dev/reference/react/useState
