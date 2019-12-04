'use strict';

const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});
const NodeVersion = ((process.versions.node || '').split('.') || [])[0] || 0;
const DevNodeVersion = 13;
// 3/8, -7/11, 3_2/7, -5_12/17
const FractionRegex = /^((-?\d+?)_)?((-?\d+?)\/(\d+?))?$/;
const Operators = {
    '+': add,
    '-': sub
};

if (NodeVersion < DevNodeVersion) {
    console.warn(` -=-= This application was developed and tested using Node.js ${DevNodeVersion} - ` +
                 `but your Node version is ${process.versions.node} =-=-`);
}

readline.on('close', () => {
    console.log('\n-=-= Bye! =-=-');
    readline.close();
});

/**
 * Calculates the gcd between the two numbers
 */
function gcd(a, b) {
    return ((b === 0) ? a : gcd(b, a % b));
}

/**
 * Simplifies the fraction by dividing both numerator and denominator by their corresponding gcd (Greatest Common Divisor)
 */
function gcdFraction(fraction) {
    const [numerator, denominator] = fraction;
    const g = Math.abs(gcd(numerator, denominator));
    return [numerator / g, denominator / g];
}

/**
 * Converts a token to fraction
 * @return number[] array - [numerator, denominator] or undefined if token provided isn't a valid fraction
 */
function fraction(token) {
    const match = token.match(FractionRegex);
    if (! match) {
        const n = Number(token);
        return (Number.isNaN(n) ? undefined : [n, 1]);
    }
    const [_, __, n1, ___, n2, n3] = match;
    let denominator = Number(n3 || 1);
    if (denominator === 0) {
        return undefined;
    }
    let numerator   = (Number(n1 || 0) * denominator) + Number(n2 || 0);
    return gcdFraction([numerator, denominator]);
}

/**
 * Adds two fractions
 */
function add (a, b) {
    const [numA, denA, numB, denB] = [...a, ...b];
    return gcdFraction([((numA * denB) + (numB * denA)), (denA * denB)]);
}

/**
 * Subtracts two fractions
 */
function sub (a, b) {
    return add(a, [-b[0], b[1]]);
}

/**
 * Normalizes the fraction (by extracting its whole part) and converts it to String
 */
function normalizeFraction(fraction) {
    const [numerator, denominator] = fraction;
    return (denominator === 1)         ? String(numerator) :
           (numerator === denominator) ? '1' :
           (numerator <   denominator) ? `${numerator}/${denominator}` :
                                         `${parseInt(numerator / denominator)}_${(numerator % denominator)}/${denominator}`;
}

/**
 * Calculates the expression and returns the result
 */
function calculate(expression) {
    if (! expression.trim()) {
        return '';
    }

    const invalidExpression = `Expression "${expression}" is invalid`;
    const tokens = (expression || '').trim().split(/\s+/);

    if ((tokens.length % 2) === 0) {
        // "$ 2 3", "$ 2 +", "$ + 3"
        return `${invalidExpression} - expected odd number of tokens but received ${tokens.length}`;
    }

    const stack = [];
    let error = undefined;
    let operator = undefined;

    for (const token of tokens) {
        if (token in Operators) {
            if (stack.length < 1) {
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
            // "$ 1/3 + something"
            error = `${invalidExpression} - "${token}" is neither a known operator nor a valid fraction operand`;
            break;
        }

        if (operator) {
            stack.push(Operators[operator](stack.pop(), f));
            operator = undefined;
       } else if (stack.length < 1) {
            stack.push(f);
        } else {
            // "$ 4 + 5 6 7"
            error = `${invalidExpression} - there is a missing operator between previous result "${stack.pop()}" and operand "${f}"`;
            break;
        }
    }

    return (error                ? error :
            (stack.length === 1) ? normalizeFraction(stack.pop()) :
                                   invalidExpression);
}

function readNextExpression() {
    readline.question('Enter your expression as "3/7 + 3_4/5 + 11/9" or press Ctrl+C to end your session $ ', (expression) => {
        console.log(calculate(expression));
        readNextExpression();
    });
}

readNextExpression();