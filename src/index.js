'use strict';

const readline = require('readline').createInterface({input: process.stdin, output: process.stdout});
const NodeVersion = ((process.versions.node || '').split('.') || [])[0] || 0;
const DevNodeVersion = 13;
const Operators = {
  '*': [(a, b) => true,      (a, b) => a * b],
  '/': [(a, b) => (b !== 0), (a, b) => a / b],
  '+': [(a, b) => true,      (a, b) => a + b],
  '-': [(a, b) => true,      (a, b) => a - b]
};

readline.on('close', () => {
    console.log('\n-=-= Bye! =-=-');
    readline.close();
});

if (NodeVersion < DevNodeVersion) {
    console.warn(` -=-= Warning: this application was developed and tested using Node.js ${DevNodeVersion} - ` +
                 `but your Node version is ${process.versions.node} =-=-`);
}

/**
 * Converts a token to number
 */
function number(token) {
    return Number(token);
}

function calculate(expression) {
    if (! expression.trim()) {
        return '';
    }

    const invalidExpression = `Expression "${expression}" is invalid`;
    const tokens = (expression || '').trim().split(/\s+/);

    if ((tokens.length % 2) === 0) {
        // "$ 2 3", "$ 2 *", "$ - 3"
        return `${invalidExpression} - expected odd number of tokens but received ${tokens.length}`;
    }

    const stack = [];
    let error = undefined;
    let operator = undefined;

    for (const token of tokens) {
        if (token in Operators) {
            if (stack.length < 1) {
                // "$ * 5 5"
                error = `${invalidExpression} - there is a missing first operand before operator "${token}"`;
                break;
            }
            if (operator) {
                // "$ 1 * +"
                error = `${invalidExpression} - there is a missing operand between two operators "${operator}" and "${token}"`;
                break;
            }

            operator = token;
            continue;
        }

        const b = number(token);

        if (operator) {
            const a        = stack.pop();
            const validate = Operators[operator][0];
            const execute  = Operators[operator][1];

            if (! validate(a, b)) {
                // "$ 4 / 0"
                error = `${invalidExpression} - operands "${a}" and "${b}" are not valid for operator "${operator}"`;
                break;
            }

            stack.push(execute(a, b));
            operator = undefined;
       } else if (stack.length < 1) {
            stack.push(b);
        } else {
            // "$ 4 * 5 6 7"
            error = `${invalidExpression} - there is a missing operator between previous result "${stack.pop()}" and operand "${b}"`;
            break;
        }
    }

    return (error                ? error :
            (stack.length === 1) ? stack.pop() :
                                   invalidExpression);
}

function readNextExpression() {
    readline.question('Enter your expression as "3/7 * 3_4/5" or press Ctrl+C to end your session $ ', (expression) => {
        console.log(calculate(expression));
        readNextExpression();
    });
}

readNextExpression();