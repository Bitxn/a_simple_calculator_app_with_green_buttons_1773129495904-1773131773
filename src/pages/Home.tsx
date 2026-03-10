import React, { useState, useCallback } from 'react';

// Define the shape of the calculator's state
interface CalculatorState {
  currentInput: string;       // The number currently displayed
  firstOperand: number | null;  // The first number in an operation
  operator: string | null;    // The operator (+, -, *, /) selected
  waitingForNewOperand: boolean; // True if the next digit should start a new number
}

export default function Home() {
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    currentInput: '0',
    firstOperand: null,
    operator: null,
    waitingForNewOperand: false,
  });

  const { currentInput, firstOperand, operator, waitingForNewOperand } = calculatorState;

  // Helper function to perform arithmetic calculations
  const calculate = useCallback((num1: number, num2: number, op: string): number => {
    switch (op) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '*':
        return num1 * num2;
      case '/':
        // Handle division by zero
        if (num2 === 0) {
          return NaN;
        }
        return num1 / num2;
      default:
        return num2; // Should not happen
    }
  }, []);

  // Handle digit button presses (0-9)
  const handleDigit = useCallback((digit: string) => {
    setCalculatorState(prevState => {
      // If current input is an error, start fresh with the new digit
      if (prevState.currentInput === 'Error' || prevState.currentInput === 'NaN') {
        return { ...prevState, currentInput: digit, waitingForNewOperand: false };
      }
      // If waiting for a new operand, replace current input with the digit
      if (prevState.waitingForNewOperand) {
        return { ...prevState, currentInput: digit, waitingForNewOperand: false };
      }
      // Prevent multiple leading zeros, but allow "0."
      if (prevState.currentInput === '0' && digit === '0') {
        return prevState;
      }
      // Replace leading "0" if a non-zero digit is pressed
      if (prevState.currentInput === '0' && digit !== '.') {
        return { ...prevState, currentInput: digit };
      }
      // Append the digit to the current input
      return { ...prevState, currentInput: prevState.currentInput + digit };
    });
  }, []);

  // Handle decimal point button press
  const handleDecimal = useCallback(() => {
    setCalculatorState(prevState => {
      // If current input is an error, start with "0."
      if (prevState.currentInput === 'Error' || prevState.currentInput === 'NaN') {
        return { ...prevState, currentInput: '0.', waitingForNewOperand: false };
      }
      // If waiting for a new operand, start with "0."
      if (prevState.waitingForNewOperand) {
        return { ...prevState, currentInput: '0.', waitingForNewOperand: false };
      }
      // Only add a decimal if one isn't already present
      if (!prevState.currentInput.includes('.')) {
        return { ...prevState, currentInput: prevState.currentInput + '.' };
      }
      return prevState;
    });
  }, []);

  // Handle operator button presses (+, -, *, /)
  const handleOperator = useCallback((nextOperator: string) => {
    setCalculatorState(prevState => {
      const inputValue = parseFloat(prevState.currentInput);

      // If input is not a valid number, display error
      if (isNaN(inputValue)) {
        return { ...prevState, currentInput: 'Error', operator: null, firstOperand: null, waitingForNewOperand: true };
      }

      // If no first operand is set, store current input as first operand
      if (prevState.firstOperand === null) {
        return {
          ...prevState,
          firstOperand: inputValue,
          operator: nextOperator,
          waitingForNewOperand: true,
        };
      } else if (prevState.operator) {
        // If an operator and first operand are already present,
        // perform the previous calculation and then set the new operator
        const result = calculate(prevState.firstOperand, inputValue, prevState.operator);
        // Check for NaN or Infinity results
        if (isNaN(result) || !isFinite(result)) {
          return { ...prevState, currentInput: 'Error', operator: null, firstOperand: null, waitingForNewOperand: true };
        }
        return {
          ...prevState,
          currentInput: String(result), // Update display with intermediate result
          firstOperand: result,        // Store result as new first operand
          operator: nextOperator,      // Set the new operator
          waitingForNewOperand: true,  // Ready for a new operand
        };
      }
      // If an operator is already present but no first operand (shouldn't happen with current logic)
      // or if operator is simply overwritten (e.g., pressing + then - immediately)
      return { ...prevState, operator: nextOperator, waitingForNewOperand: true };
    });
  }, [calculate]);

  // Handle equals button press
  const handleEquals = useCallback(() => {
    setCalculatorState(prevState => {
      const inputValue = parseFloat(prevState.currentInput);

      // If input is not a valid number, display error
      if (isNaN(inputValue)) {
        return { ...prevState, currentInput: 'Error', operator: null, firstOperand: null, waitingForNewOperand: true };
      }

      // Only perform calculation if a first operand and operator are set
      if (prevState.firstOperand !== null && prevState.operator !== null) {
        const result = calculate(prevState.firstOperand, inputValue, prevState.operator);
        // Check for NaN or Infinity results
        if (isNaN(result) || !isFinite(result)) {
          return { ...prevState, currentInput: 'Error', operator: null, firstOperand: null, waitingForNewOperand: true };
        }
        return {
          ...prevState,
          currentInput: String(result), // Display the final result
          firstOperand: null,           // Reset first operand
          operator: null,               // Reset operator
          waitingForNewOperand: true,   // Ready to start a new calculation
        };
      }
      return prevState; // If no operation to perform, do nothing
    });
  }, [calculate]);

  // Handle clear (AC) button press
  const handleClear = useCallback(() => {
    setCalculatorState({
      currentInput: '0',
      firstOperand: null,
      operator: null,
      waitingForNewOperand: false,
    });
  }, []);

  // Handle percentage button press
  const handlePercentage = useCallback(() => {
    setCalculatorState(prevState => {
      const inputValue = parseFloat(prevState.currentInput);
      if (isNaN(inputValue) || prevState.currentInput === 'Error') {
        return { ...prevState, currentInput: 'Error', waitingForNewOperand: true };
      }
      const result = inputValue / 100;
      return { ...prevState, currentInput: String(result) };
    });
  }, []);

  // Handle toggle sign (+/-) button press
  const handleToggleSign = useCallback(() => {
    setCalculatorState(prevState => {
      const inputValue = parseFloat(prevState.currentInput);
      if (isNaN(inputValue) || inputValue === 0 || prevState.currentInput === 'Error') {
        return prevState; // Do nothing if it's 0 or an error
      }
      return { ...prevState, currentInput: String(-inputValue) };
    });
  }, []);

  // Tailwind CSS classes for consistent button styling
  const buttonClass = "flex items-center justify-center rounded-xl text-xl font-medium transition-all duration-200 ease-in-out transform active:scale-95";
  const digitButtonClass = `${buttonClass} bg-blue-800 text-white hover:bg-blue-700`;
  const operatorButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-500`;
  const utilityButtonClass = `${buttonClass} bg-blue-700 text-white hover:bg-blue-600`;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Calculator Card */}
      <div
        className="
          bg-zinc-900/60
          backdrop-filter backdrop-blur-lg
          border border-white/10
          rounded-3xl
          shadow-2xl
          p-6
          w-full max-w-sm
          space-y-4
          flex flex-col
          "
      >
        {/* Header Section */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-white text-3xl font-bold tracking-tight">Calculator</h1>
          <span className="text-gray-400 text-sm font-medium">v1.0</span>
        </div>

        {/* Display Area */}
        <div
          className="
            bg-zinc-900
            border border-white/10
            rounded-2xl
            p-5
            text-right
            text-white
            text-6xl
            font-light
            tracking-wide
            min-h-[100px]
            flex items-center justify-end
            overflow-hidden
            "
        >
          {currentInput}
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* First Row: Utility and Division */}
          <button onClick={handleClear} className={utilityButtonClass}>AC</button>
          <button onClick={handleToggleSign} className={utilityButtonClass}>+/-</button>
          <button onClick={handlePercentage} className={utilityButtonClass}>%</button>
          <button onClick={() => handleOperator('/')} className={operatorButtonClass}>{'/'}</button>

          {/* Second Row: 7, 8, 9, Multiply */}
          <button onClick={() => handleDigit('7')} className={digitButtonClass}>7</button>
          <button onClick={() => handleDigit('8')} className={digitButtonClass}>8</button>
          <button onClick={() => handleDigit('9')} className={digitButtonClass}>9</button>
          <button onClick={() => handleOperator('*')} className={operatorButtonClass}>*</button>

          {/* Third Row: 4, 5, 6, Subtract */}
          <button onClick={() => handleDigit('4')} className={digitButtonClass}>4</button>
          <button onClick={() => handleDigit('5')} className={digitButtonClass}>5</button>
          <button onClick={() => handleDigit('6')} className={digitButtonClass}>6</button>
          <button onClick={() => handleOperator('-')} className={operatorButtonClass}>-</button>

          {/* Fourth Row: 1, 2, 3, Add */}
          <button onClick={() => handleDigit('1')} className={digitButtonClass}>1</button>
          <button onClick={() => handleDigit('2')} className={digitButtonClass}>2</button>
          <button onClick={() => handleDigit('3')} className={digitButtonClass}>3</button>
          <button onClick={() => handleOperator('+')} className={operatorButtonClass}>+</button>

          {/* Fifth Row: 0, Decimal, Equals */}
          <button onClick={() => handleDigit('0')} className={`${digitButtonClass} col-span-2`}>0</button>
          <button onClick={handleDecimal} className={digitButtonClass}>.</button>
          <button onClick={handleEquals} className={operatorButtonClass}>=</button>
        </div>
      </div>
    </div>
  );
}