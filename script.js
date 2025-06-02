// Core Calculation Functions

function calculateFinalAmount(P, R_annual, T_years, n_compound_freq) {
    if (P <= 0 || R_annual < 0 || T_years <= 0 || n_compound_freq <= 0) {
        return { error: "Principal, Rate, Time, and Frequency must be positive. Rate can be zero." };
    }
    const R_decimal = R_annual / 100;
    const A = P * Math.pow(1 + R_decimal / n_compound_freq, n_compound_freq * T_years);
    return { value: A };
}

function calculatePrincipal(A, R_annual, T_years, n_compound_freq) {
    if (A <= 0 || R_annual < 0 || T_years <= 0 || n_compound_freq <= 0) {
        return { error: "Amount, Rate, Time, and Frequency must be positive. Rate can be zero." };
    }
    const R_decimal = R_annual / 100;
    const P = A / Math.pow(1 + R_decimal / n_compound_freq, n_compound_freq * T_years);
    return { value: P };
}

function calculateRate(A, P, T_years, n_compound_freq) {
    if (A <= 0 || P <= 0 || T_years <= 0 || n_compound_freq <= 0) {
        return { error: "Amount, Principal, Time, and Frequency must be positive." };
    }
    if (A < P) {
        return { error: "Final Amount (A) cannot be less than Principal (P) when calculating rate." };
    }
    // (A/P)^(1/(n*T)) can be written as Math.pow(A/P, 1/(n*T))
    // R_decimal = n * (Math.pow(A / P, 1 / (n_compound_freq * T_years)) - 1)
    // Handle potential issues with fractional exponents if A/P is negative (though P and A must be positive)
    // or if base is zero.
    
    const base = A / P;
    const exponent = 1 / (n_compound_freq * T_years);

    if (base < 0) return { error: "Cannot calculate rate with negative A/P ratio (should not happen with positive A, P)." };

    const term = Math.pow(base, exponent);
    const R_decimal = n_compound_freq * (term - 1);

    if (isNaN(R_decimal) || !isFinite(R_decimal)) {
        return { error: "Could not calculate a valid rate. Check input values." };
    }
    const R_annual = R_decimal * 100;
    return { value: R_annual };
}

function calculateTime(A, P, R_annual, n_compound_freq) {
    if (A <= 0 || P <= 0 || R_annual <= 0 || n_compound_freq <= 0) {
        // R_annual must be > 0 for log, otherwise division by zero or log of non-positive.
        return { error: "Amount, Principal, Rate, and Frequency must be positive for time calculation." };
    }
    if (A < P && R_annual > 0) {
         return { error: "Final Amount (A) cannot be less than Principal (P) if rate is positive."};
    }
    if (A === P && R_annual > 0) return { value: 0 }; // No time needed if A=P
    if (A > P && R_annual === 0) return { error: "Rate must be greater than 0 for Amount to grow."};


    const R_decimal = R_annual / 100;
    // T_years = Math.log(A/P) / (n_compound_freq * Math.log(1 + R_decimal / n_compound_freq))
    const numerator = Math.log(A / P);
    const denominator = n_compound_freq * Math.log(1 + R_decimal / n_compound_freq);

    if (denominator === 0) {
        return { error: "Cannot calculate time. Possible division by zero (check rate and frequency)." };
    }
    if (A / P <= 0) {
        return { error: "Cannot calculate time with non-positive A/P ratio."}
    }
     if ((1 + R_decimal / n_compound_freq) <= 0 ) {
        return { error: "Cannot calculate time due to log of non-positive value in denominator."}
    }


    const T_years = numerator / denominator;
    if (isNaN(T_years) || !isFinite(T_years)) {
        return { error: "Could not calculate a valid time. Check input values (e.g. A < P with positive rate)." };
    }
    return { value: T_years };
}

function calculateFrequency(A, P, R_annual, T_years) {
    // Solving for 'n' algebraically is complex.
    // For this version, we will inform the user.
    // A = P (1 + R/n)^(nT)
    // (A/P)^(1/T) = (1 + R/n)^n  -> Let K = (A/P)^(1/T)
    // K = (1 + R/n)^n
    // This equation is typically solved numerically for n.
    return {
        message: "Solving for Compounding Frequency (n) directly is mathematically complex and not supported by this calculator. Consider testing different 'n' values by solving for 'A'."
    };
}

// Make sure the DOMContentLoaded event listener and its contents are below these function definitions,
// or ensure these functions are defined before they are called if you are modifying an existing script.js.
// If script.js was just created, this code should be placed before the
// document.addEventListener('DOMContentLoaded', () => { ... }); block if it's at the top-level,
// or simply outside and after it if the functions are meant to be global.
// For simplicity and encapsulation, it's often better to define functions before they are used.
// However, function declarations are hoisted. Let's ensure they are defined before the event listener
// that might eventually call them.

/*
The existing script.js content is assumed to be:
document.addEventListener('DOMContentLoaded', () => {
    // ... UI logic from Part 1
});
This new code should be placed BEFORE that block.
*/
document.addEventListener('DOMContentLoaded', () => {
    const principalInput = document.getElementById('principal');
    const rateInput = document.getElementById('rate');
    const timeInput = document.getElementById('time');
    const frequencyInput = document.getElementById('frequency');
    const amountInput = document.getElementById('amount');
    const solveForSelect = document.getElementById('solveFor');
    const interestForm = document.getElementById('interestForm');
    const resultDiv = document.getElementById('result');
    const calculateButton = document.getElementById('calculateButton');

    const inputs = {
        principal: principalInput,
        rate: rateInput,
        time: timeInput,
        frequency: frequencyInput,
        amount: amountInput
    };

    function updateInputStates() {
        const solveForValue = solveForSelect.value;

        // Enable all inputs first
        for (const key in inputs) {
            if (inputs.hasOwnProperty(key)) {
                inputs[key].disabled = false;
                inputs[key].style.backgroundColor = ''; // Reset background color
            }
        }

        // Disable the input that is being solved for
        if (inputs[solveForValue]) {
            inputs[solveForValue].disabled = true;
            inputs[solveForValue].value = ''; // Clear its value
            inputs[solveForValue].style.backgroundColor = '#e9e9e9'; // Optional: visual cue
        }
    }

    // Initial state setup based on default selection
    updateInputStates();

    solveForSelect.addEventListener('change', updateInputStates);

    function performCalculation() {
        const resultDiv = document.getElementById('result'); // Ensure resultDiv is accessible
        resultDiv.innerHTML = ''; // Clear previous results

        // Get references to input elements (ensure these are defined in the outer scope of DOMContentLoaded)
        const principalInput = document.getElementById('principal');
        const rateInput = document.getElementById('rate');
        const timeInput = document.getElementById('time');
        const frequencyInput = document.getElementById('frequency');
        const amountInput = document.getElementById('amount');
        const solveForSelect = document.getElementById('solveFor');

        const P_val = parseFloat(principalInput.value);
        const R_val = parseFloat(rateInput.value);
        const T_val = parseFloat(timeInput.value);
        const n_val = parseInt(frequencyInput.value);
        const A_val = parseFloat(amountInput.value);
        const solveForValue = solveForSelect.value;

        let calculationResult;
        let validationError = "";

        // Input validation based on which fields are active
        if (solveForValue !== 'principal' && !principalInput.disabled && (isNaN(P_val) || P_val <= 0)) {
            validationError = "Principal (P) must be a positive number.";
        } else if (solveForValue !== 'rate' && !rateInput.disabled && (isNaN(R_val) || R_val < 0)) {
            validationError = "Rate (R) must be a non-negative number.";
        } else if (solveForValue !== 'time' && !timeInput.disabled && (isNaN(T_val) || T_val <= 0)) {
            validationError = "Time (T) must be a positive number.";
        } else if (solveForValue !== 'frequency' && !frequencyInput.disabled && (isNaN(n_val) || n_val <= 0)) {
            validationError = "Compounding Frequency (n) must be a positive integer.";
        } else if (solveForValue !== 'amount' && !amountInput.disabled && (isNaN(A_val) || A_val <= 0)) {
            validationError = "Final Amount (A) must be a positive number.";
        }

        if (validationError) {
            resultDiv.innerHTML = `<p class="error">${validationError}</p>`;
            return;
        }

        // Call the appropriate global calculation function
        switch (solveForValue) {
            case 'amount':
                calculationResult = calculateFinalAmount(P_val, R_val, T_val, n_val);
                break;
            case 'principal':
                calculationResult = calculatePrincipal(A_val, R_val, T_val, n_val);
                break;
            case 'rate':
                calculationResult = calculateRate(A_val, P_val, T_val, n_val);
                break;
            case 'time':
                calculationResult = calculateTime(A_val, P_val, R_val, n_val);
                break;
            case 'frequency':
                calculationResult = calculateFrequency(A_val, P_val, R_val, T_val);
                break;
            default:
                calculationResult = { error: "Invalid selection for 'solve for'." };
        }

        if (calculationResult.error) {
            resultDiv.innerHTML = `<p class="error">${calculationResult.error}</p>`;
        } else if (calculationResult.message) {
            resultDiv.innerHTML = `<p>${calculationResult.message}</p>`;
        } else if (calculationResult.value !== undefined) {
            let resultLabel = solveForValue.charAt(0).toUpperCase() + solveForValue.slice(1);
            let resultValueDisplay = parseFloat(calculationResult.value.toFixed(4)); // More precision before specific formatting

            // Unit and specific formatting
            let unit = "";
            if (solveForValue === 'rate') {
                unit = '%';
                resultValueDisplay = parseFloat(calculationResult.value.toFixed(2)); // Standard for percentage
            } else if (solveForValue === 'time') {
                unit = ' years';
                resultValueDisplay = parseFloat(calculationResult.value.toFixed(2)); // Standard for years
            } else if (solveForValue === 'principal' || solveForValue === 'amount') {
                 resultValueDisplay = parseFloat(calculationResult.value.toFixed(2)); // Standard for currency
            } else if (solveForValue === 'frequency') {
                resultValueDisplay = Math.round(calculationResult.value); // Frequency is an integer
            }


            resultDiv.innerHTML = `<p>${resultLabel}: ${resultValueDisplay}${unit}</p>`;
        } else {
            resultDiv.innerHTML = `<p class="error">An unexpected error occurred during calculation.</p>`;
        }
    }

    interestForm.addEventListener('submit', (event) => {
        event.preventDefault();
        performCalculation(); // Call the new function
    });

    // Also handle calculation on button click if the form event is not preferred for some reason
    // calculateButton.addEventListener('click', () => {
    //     // Placeholder for calculation logic
    //     resultDiv.innerHTML = '<p>Calculation logic to be implemented via button...</p>';
    //     // performCalculation();
    // });

    // Initialize with amount disabled as it's the default "solveFor"
    // This call was here before, it should remain to ensure correct initial UI state.
    updateInputStates(); 
});
