import * as Monaco from 'monaco-editor';

const KEYWORDS = {
  accessModifiers: ['use'],
  dataTypes: ['list', 'arr'],
  functions: ['fn', 'let', 'const', 'return', 'print', 'export'],
  flowControl: ['if', 'for', 'else', 'in'],
  primitives: ['str', 'num', 'bool', 'any'],
  operators: ['=', '==', '===', '+', '-', '*', '/'],
  punctuation: [';', ',', '.', '(', ')', '{', '}', '[', ']', '..'],
};

const ALL_KEYWORDS = [
  ...KEYWORDS.accessModifiers,
  ...KEYWORDS.dataTypes,
  ...KEYWORDS.functions,
  ...KEYWORDS.flowControl,
  ...KEYWORDS.primitives,
];

interface MonacoHoverProvider {
  provideHover: Monaco.languages.HoverProvider['provideHover'];
}

interface MonacoSignatureHelpProvider {
  provideSignatureHelp: Monaco.languages.SignatureHelpProvider['provideSignatureHelp'];
}

export function setupMonaco(monacoInstance: typeof Monaco, languageId: string) {
  // Register the custom language
  monacoInstance.languages.register({ id: languageId });

  // Define the language syntax and tokenizer
  monacoInstance.languages.setMonarchTokensProvider(languageId, {
    keywords: ALL_KEYWORDS,
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/fn\b/, 'keyword.function', '@function_declaration'],
        [/[{}()\[\]]/, '@brackets'],
        [/[;,.]/, 'delimiter'],
        [/@[a-zA-Z][\w$]*/, 'variable.predefined'],
        [
          /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(?!(\b(?:string|number|boolean|any)\b))/,
          'invalid',
        ],
        [
          /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*const\b/,
          'invalid',
        ],
        [
          /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(\b(?:string|number|boolean|any)\b)\s*{/,
          'keyword.function',
          '@function_body'
        ],
        [
          /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(\b(?:string|number|boolean|any)\b)\s*:/,
          'keyword.function',
        ],
        [
          /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:/,
          'keyword.function',
        ],
        [/[+-\/%^*=<>!]+/, 'operator'],
        [/\d+(\.\d+)?/, 'number'],
      ],
      comment: [
        [/[^*/]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[*/]/, 'comment'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
        [/\\$/, 'string.escape'],
        [/.*/, 'string.invalid'],
      ],
      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
        [/\\$/, 'string.escape'],
        [/.*/, 'string.invalid'],
      ],
      function_declaration: [
        [/[a-zA-Z_]\w*/, 'identifier'],
        [/\(/, '@brackets', '@parameters'],
        { include: '@root' },
      ],
      parameters: [
        [/\)/, '@brackets', '@pop'],
        { include: '@root' },
      ],
      function_body: [
        [/[{}]/, 'brackets', '@brackets'],
        { include: '@root' },
      ],
      brackets: [
        [/[(){}\[\]]/, 'brackets'],
        { include: '@root' },
      ],
    },
    accessModifiers: KEYWORDS.accessModifiers,
    dataTypes: KEYWORDS.dataTypes,
    functions: KEYWORDS.functions,
    flowControl: KEYWORDS.flowControl,
    primitives: KEYWORDS.primitives,
  });

  // Register completion item provider
  const provideCompletionItems: Monaco.languages.CompletionItemProvider['provideCompletionItems'] =
    (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = new monacoInstance.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );
      const suggestions = ALL_KEYWORDS.map((k) => ({
        label: k,
        kind: monacoInstance.languages.CompletionItemKind.Keyword,
        insertText: k,
        range: range,
      }));
      return { suggestions };
    };

  monacoInstance.languages.registerCompletionItemProvider(languageId, {
    provideCompletionItems,
  });

  // Register hover provider
  const provideHover: MonacoHoverProvider['provideHover'] = (
    model,
    position
  ) => {
    const word = model.getWordAtPosition(position);
    if (word) {
      return {
        range: new monacoInstance.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [{ value: `**Keyword**: ${word.word}` }],
      };
    }
    return null;
  };

  monacoInstance.languages.registerHoverProvider(languageId, {
    provideHover,
  });

  // Register signature help provider
  const provideSignatureHelp: MonacoSignatureHelpProvider['provideSignatureHelp'] =
    () => {
      return {
        value: {
          signatures: [
            {
              label: 'fn example(param1: Type1, param2: Type2): ReturnType',
              parameters: [
                { label: 'param1', documentation: 'First parameter' },
                { label: 'param2', documentation: 'Second parameter' },
              ],
            },
          ],
          activeSignature: 0,
          activeParameter: 0,
        },
        dispose: () => {},
      };
    };

  monacoInstance.languages.registerSignatureHelpProvider(languageId, {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp,
  });
}
