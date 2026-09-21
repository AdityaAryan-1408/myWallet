import { evaluateExpression } from '../src/utils/mathEvaluator';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('--- Testing Math Evaluator ---');
assert(evaluateExpression('120') === 120, 'Failed 120');
assert(evaluateExpression('120 + 45') === 165, 'Failed 120 + 45');
assert(evaluateExpression('50 * 3 + 20') === 170, 'Failed 50 * 3 + 20 (precedence)');
assert(evaluateExpression('250 - 45.5') === 204.5, 'Failed decimal subtraction');
assert(evaluateExpression('100 / 4') === 25, 'Failed division');
assert(evaluateExpression('120 + ') === 120, 'Failed trailing operator');
assert(evaluateExpression('50 * ') === 50, 'Failed trailing operator 2');
assert(evaluateExpression('') === 0, 'Failed empty');
console.log('All math evaluator tests passed successfully!');
