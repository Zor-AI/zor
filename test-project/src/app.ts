function add(a: number, b: number): number {
  return a + b;
}

function multiply(a: number, b: number): number {
  return a * b;  // bug: should be a * b
}

function buggyDivide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b; // BUG: returns NaN for string inputs
}

const result = add(5, 3);
console.log("5 + 3 =", result);

const product = multiply(4, 2);
console.log("4 * 2 =", product);

// This will crash
console.log("10 / 0 =", buggyDivide(10, 0));
