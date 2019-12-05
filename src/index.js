'use strict';

const {Tests} = require('./tests');
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});
// 3/8, -7/11, 3_2/7, -5_12/17
const FractionRegex = /^((-?\d+?)_)?((-?\d+?)\/(\d+?))?$/;
const Operators = {
    '+': add,
    '-': sub
};

readline.on('close', () => {
    console.log('\nBye!');
    readline.close();
});

/**
 * Calculates the gcd between the two numbers
 */
function gcd(a, b) {
    return ((b === 0) ? a : gcd(b, a % b));
}

/**
 * Normalizes the fraction by dividing both numerator and denominator by their corresponding gcd (Greatest Common Divisor)
 */
function gcdFraction(fraction) {
    const [numerator, denominator] = fraction;
    const g = Math.abs(gcd(numerator, denominator));
    return [numerator / g, denominator / g];
}

/**
 * Converts a token to a fraction
 * @return number[] array - [numerator, denominator] or undefined if token provided isn't a valid fraction
 */
function fraction(token) {
    const match = token.match(FractionRegex);

    if (! match) {
        const n = Number(token);
        return (Number.isNaN(n) ? undefined : [n, 1]);
    }

    const [_, __, n1, ___, n2, n3] = match;
    const whole       = Number(n1 || 0);
    let numerator     = Number(n2 || 0);
    const denominator = Number(n3 || 1);

    if (denominator === 0) {
        return undefined;
    }

    numerator = (whole * denominator) + (((whole < 0) || (n1 === '-0')) ? -numerator : numerator);
    return gcdFraction([numerator, denominator]);
}

/**
 * Adds two fractions
 */
function add (a, b) {
    const [numA, denA, numB, denB] = [...a, ...b];

    if (denA === denB) {
        return gcdFraction([(numA + numB), denA]);
    }

    const g = gcd(denA, denB);

    return ((g === denA) ? add([(numA * (denB / denA)), denB], b) :
            (g === denB) ? add(a, [(numB * (denA / denB)), denA]) :
                           gcdFraction([((numA * denB) + (numB * denA)), (denA * denB)]));
}

/**
 * Subtracts two fractions
 */
function sub (a, b) {
    return add(a, [-b[0], b[1]]);
}

/**
 * Converts a fraction to a String
 */
function toString(fraction) {
    const [numerator, denominator] = fraction;

    return ((numerator   === 0)                 ? String(0) :
            (denominator === 1)                 ? String(numerator) :
            (numerator === denominator)         ? '1' :
            (Math.abs(numerator) < denominator) ? `${numerator}/${denominator}` :
            ((numerator % denominator) === 0)   ? String(numerator / denominator) :
                `${parseInt(numerator / denominator)}_${Math.abs(numerator) % denominator}/${denominator}`);
}

/**
 * Evaluates the expression and returns the result as normalized fraction,
 * or an error message if fails to evaluate the expression
 */
function evaluate(expression) {
    // noinspection AssignmentToFunctionParameterJS
    expression = (expression || '').trim();

    if (! expression) { return ''; }

    const invalidExpression = `Expression "${expression}" is invalid`;
    const tokens = expression.split(/\s+/);

    if ((tokens.length % 2) === 0) {
        // "$ 2 3", "$ 2 +", "$ + 3"
        return `${invalidExpression} - expected odd number of tokens but received ${tokens.length}`;
    }

    let previousValue = undefined, operator = undefined, error = undefined;

    for (const token of tokens) {

        if (token in Operators) {
            if (! previousValue) {
                // "$ + 5 5"
                error = `${invalidExpression} - there is a missing first operand before operator "${token}"`;
                break;
            }
            if (operator) {
                // "$ 1 + +"
                error = `${invalidExpression} - there is a missing operand between two operators "${operator}" and "${token}"`;
                break;
            }

            operator = token;
            continue;
        }

        const f = fraction(token);

        if (! f) {
            // "$ 1/something" or "$ 3/0"
            error = `${invalidExpression} - "${token}" is neither a known operator nor a valid fraction operand`;
            break;
        }

        if (operator) {
            previousValue = Operators[operator](previousValue, f);
            operator = undefined;
       } else if (! previousValue) {
            previousValue = f;
        } else {
            // "$ 4 + 5 6 7"
            error = `${invalidExpression} - there is a missing operator between ` +
                    `previous result "${toString(previousValue)}" and operand "${toString(f)}"`;
            break;
        }
    }

    return (error         ? error :
            previousValue ? toString(previousValue) :
                            invalidExpression);
}

/**
 * Runs all tests and throws an error when any test fails
 */
function runTests() {
    const expressions = Object.keys(Tests);
    const time = new Date();

    expressions.forEach((expression) => {
        const expectedResult = Tests[expression];
        const result         = evaluate(expression);
        if (result === expectedResult) {
            process.stdout.write('.');
        } else {
            throw new Error(`Failed test: evaluate("${expression}") = "${result}" and not "${expectedResult}"`);
        }
    });

    console.log(`\n${expressions.length} test${(expressions.length === 1) ? '' : 's'} ` +
                `completed in ${(new Date() - time)} ms`);
}

/**
 * REPL: reads user expression, evaluates it and displays the result
 */
function readNextExpression() {
    readline.question('Enter your expression as "1 + -3/7 + 3_4/5 - 11/9" or press Ctrl+C to end your session $ ',
                      (expression) => {
        console.log(evaluate(expression));
        readNextExpression();
    });
}

runTests();
readNextExpression();