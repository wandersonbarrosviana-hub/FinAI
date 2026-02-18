
const annualRate = 10;
const annualInflation = 4;
const monthlyContribution = 1000;
const currentPatrimony = 10000;
const desiredIncome = 5000;

const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;

let currentBalance = currentPatrimony;
let totalInvested = currentPatrimony;
let cumulativeInflationFactor = 1;

console.log("Month | Total Invested (Nominal) | Real Value Factor | Real Invested (Incorrect)")
for (let i = 0; i <= 24; i++) {
    const interestEarned = currentBalance * monthlyRate;

    if (i > 0) {
        currentBalance += interestEarned + monthlyContribution;
        totalInvested += monthlyContribution;
        cumulativeInflationFactor *= (1 + monthlyInflation);
    }

    const realInvestedIncorrect = totalInvested / cumulativeInflationFactor;

    if (i % 6 === 0) {
        console.log(`${i} | ${totalInvested.toFixed(0)} | ${cumulativeInflationFactor.toFixed(4)} | ${realInvestedIncorrect.toFixed(0)}`);
    }
}
