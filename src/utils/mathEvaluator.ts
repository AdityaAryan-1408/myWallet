/**
 * MyWallet — Safe Mathematical Expression Evaluator
 * 
 * Evaluates in-app keypad arithmetic without using eval() or Function().
 * Supports +, −, ×, ÷, decimals, and live progressive subtotals.
 */

/**
 * Normalizes input operators to standard JS operators:
 * '×' -> '*', '÷' -> '/', '−' -> '-'
 */
export function normalizeExpression(expr: string): string {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');
}

/**
 * Tokenizes and evaluates an arithmetic expression respecting standard operator precedence.
 * If expression ends with a trailing operator (e.g. "120 + "), it evaluates up to the last complete operand.
 */
export function evaluateExpression(expr: string): number {
  if (!expr || expr.trim() === '') return 0;

  const normalized = normalizeExpression(expr);

  // If ends with an operator, strip trailing operator for live preview
  let cleanExpr = normalized.replace(/[\+\-\*\/]+$/, '');
  if (!cleanExpr) return 0;

  try {
    // Tokenize into numbers and operators
    const tokens: Array<number | string> = [];
    let currentNumber = '';

    for (let i = 0; i < cleanExpr.length; i++) {
      const char = cleanExpr[i];

      if ((char >= '0' && char <= '9') || char === '.') {
        currentNumber += char;
      } else if (['+', '-', '*', '/'].includes(char)) {
        // Handle unary minus at start
        if (char === '-' && currentNumber === '' && tokens.length === 0) {
          currentNumber = '-';
          continue;
        }

        if (currentNumber !== '') {
          tokens.push(parseFloat(currentNumber));
          currentNumber = '';
        }
        tokens.push(char);
      }
    }

    if (currentNumber !== '') {
      tokens.push(parseFloat(currentNumber));
    }

    if (tokens.length === 0) return 0;

    // First pass: Multiplication and Division
    const pass1: Array<number | string> = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === '*' || token === '/') {
        const prev = pass1.pop() as number;
        const next = tokens[i + 1] as number;
        if (typeof prev !== 'number' || typeof next !== 'number') {
          return 0;
        }
        const result = token === '*' ? prev * next : next !== 0 ? prev / next : 0;
        pass1.push(result);
        i += 2;
      } else {
        pass1.push(token);
        i++;
      }
    }

    // Second pass: Addition and Subtraction
    let result = pass1[0] as number;
    let j = 1;
    while (j < pass1.length) {
      const operator = pass1[j];
      const nextNum = pass1[j + 1] as number;
      if (typeof nextNum === 'number') {
        if (operator === '+') {
          result += nextNum;
        } else if (operator === '-') {
          result -= nextNum;
        }
      }
      j += 2;
    }

    // Round to 2 decimal places to prevent floating point inaccuracies
    return Math.round(result * 100) / 100;
  } catch (err) {
    console.warn('Error evaluating expression:', err);
    return 0;
  }
}
