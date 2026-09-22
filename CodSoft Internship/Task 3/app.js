let currentValue = '0';

function render() {
    document.getElementById('calcDisplay').value = currentValue;
}

function inputNum(num) {
    if (currentValue === '0') {
        currentValue = num;
    } else {
        currentValue += num;
    }
    render();
}

function inputOp(op) {
    const ops = ['+', '-', '*', '/'];
    const lastChar = currentValue.slice(-1);

    if (ops.includes(lastChar)) {
        currentValue = currentValue.slice(0, -1) + op;
    } else {
        currentValue += op;
    }
    render();
}

function addDecimal(dot) {
    const lastSegment = currentValue.split(/[\+\-\*\/]/).pop();
    if (!lastSegment.includes(dot)) {
        currentValue += dot;
        render();
    }
}

function removeChar() {
    currentValue = currentValue.slice(0, -1) || '0';
    render();
}

function resetDisplay() {
    currentValue = '0';
    render();
}

function evaluateCalc() {
    try {
        const result = eval(currentValue);
        currentValue = result.toString();
    } catch {
        currentValue = 'Error';
    }
    render();
}

render();
