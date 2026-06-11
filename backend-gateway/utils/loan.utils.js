/**
 * Calculates the monthly EMI using the compound interest formula.
 * @param {number} principal - The loan amount
 * @param {number} annualInterestRate - The annual interest rate percentage
 * @param {number} tenureMonths - The loan tenure in months
 * @returns {number} The calculated EMI
 */
export const calculateEMI = (principal, annualInterestRate, tenureMonths) => {
  if (tenureMonths <= 0) return 0;
  const p = parseFloat(principal);
  const r = parseFloat(annualInterestRate) / 100 / 12;
  if (r === 0) return p / tenureMonths;
  const emi = (p * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return emi;
};
