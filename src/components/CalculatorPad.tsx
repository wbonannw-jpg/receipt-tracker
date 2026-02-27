"use client";

import { useState, useEffect } from "react";
import { Delete, Check } from "lucide-react";

type CalculatorPadProps = {
    initialValue?: number;
    onComplete: (value: number) => void;
    onClose: () => void;
};

export default function CalculatorPad({ initialValue = 0, onComplete, onClose }: CalculatorPadProps) {
    const [display, setDisplay] = useState(initialValue === 0 ? "" : initialValue.toString());
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [isNewNumber, setIsNewNumber] = useState(initialValue !== 0);

    // Helper to calculate
    const calculate = (a: number, b: number, op: string): number => {
        switch (op) {
            case "+": return a + b;
            case "-": return a - b;
            case "×": return a * b;
            case "÷": return b !== 0 ? Math.floor(a / b) : 0; // Simple integer division for money
            default: return b;
        }
    };

    const handleNumber = (numStr: string) => {
        if (isNewNumber) {
            setDisplay(numStr);
            setIsNewNumber(false);
        } else {
            // Prevent multiple leading zeros
            if (display === "0" && numStr !== "0") {
                setDisplay(numStr);
            } else if (display === "0" && numStr === "0") {
                // do nothing
            } else if (display === "" && numStr === "00") {
                setDisplay("0");
            } else {
                setDisplay(display + numStr);
            }
        }
    };

    const handleOperator = (op: string) => {
        const currentValue = parseFloat(display) || 0;

        if (operator && previousValue !== null && !isNewNumber) {
            const newValue = calculate(previousValue, currentValue, operator);
            setDisplay(newValue.toString());
            setPreviousValue(newValue);
        } else {
            setPreviousValue(currentValue);
        }

        setOperator(op);
        setIsNewNumber(true);
    };

    const handleEqual = () => {
        if (operator && previousValue !== null) {
            const currentValue = parseFloat(display) || 0;
            const newValue = calculate(previousValue, currentValue, operator);
            setDisplay(newValue.toString());
            setPreviousValue(null);
            setOperator(null);
            setIsNewNumber(true);
        }
    };

    const handleDelete = () => {
        if (isNewNumber) return;
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay("");
        }
    };

    const handleClear = () => {
        setDisplay("");
        setPreviousValue(null);
        setOperator(null);
        setIsNewNumber(true);
    };

    const handleSubmit = () => {
        // Evaluate pending operations before submitting if needed
        let finalValue = parseFloat(display) || 0;
        if (operator && previousValue !== null && !isNewNumber) {
            finalValue = calculate(previousValue, finalValue, operator);
        }

        // Ensure we don't return negative money unless it's intended, but usually it's >= 0
        onComplete(Math.max(0, finalValue));
    };

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={handleOverlayClick}
        >
            <div
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="calc-container"
            >
                {/* Header / Display */}
                <div className="flex justify-between items-end mb-4 bg-muted p-4" style={{ borderRadius: '12px', background: 'var(--secondary)' }}>
                    <div className="text-muted text-sm" style={{ minHeight: '1.2rem' }}>
                        {previousValue !== null ? `${previousValue} ${operator}` : ''}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ¥ {display ? Number(display).toLocaleString() : "0"}
                    </div>
                </div>

                {/* Keypad Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.8rem',
                    marginBottom: '1rem'
                }}>
                    <button className="calc-btn op-btn" onClick={handleClear}>C</button>
                    <button className="calc-btn op-btn" onClick={() => handleOperator("÷")}>÷</button>
                    <button className="calc-btn op-btn" onClick={() => handleOperator("×")}>×</button>
                    <button className="calc-btn op-btn text-destructive" onClick={handleDelete}><Delete size={20} /></button>

                    <button className="calc-btn num-btn" onClick={() => handleNumber("7")}>7</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("8")}>8</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("9")}>9</button>
                    <button className="calc-btn op-btn" onClick={() => handleOperator("-")}>-</button>

                    <button className="calc-btn num-btn" onClick={() => handleNumber("4")}>4</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("5")}>5</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("6")}>6</button>
                    <button className="calc-btn op-btn" onClick={() => handleOperator("+")}>+</button>

                    <button className="calc-btn num-btn" onClick={() => handleNumber("1")}>1</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("2")}>2</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("3")}>3</button>
                    <button className="calc-btn action-btn" style={{ gridRow: 'span 2' }} onClick={handleEqual}>=</button>

                    <button className="calc-btn num-btn" style={{ gridColumn: 'span 2' }} onClick={() => handleNumber("0")}>0</button>
                    <button className="calc-btn num-btn" onClick={() => handleNumber("00")}>00</button>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        className="btn btn-outline"
                        style={{ flex: 1, padding: '1rem' }}
                        onClick={onClose}
                    >
                        キャンセル
                    </button>
                    <button
                        className="btn btn-primary flex items-center justify-center gap-2"
                        style={{ flex: 2, padding: '1rem' }}
                        onClick={handleSubmit}
                    >
                        <Check size={20} /> 入力完了
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .calc-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 1.2rem 0;
                    font-size: 1.5rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.1s;
                }
                .calc-btn:active {
                    transform: scale(0.95);
                }
                .num-btn {
                    background-color: var(--background);
                    color: var(--foreground);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .op-btn {
                    background-color: var(--secondary);
                    color: var(--primary);
                    font-weight: 600;
                }
                .action-btn {
                    background-color: var(--primary);
                    color: white;
                    font-weight: 600;
                }
            `}} />
        </div>
    );
}
