
const annualRate = 5;
const annualInflation = 10;
const monthlyContribution = 1000;
const currentPatrimony = 100000;

const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;

let currentBalance = currentPatrimony;
let totalInvested = currentPatrimony;
let cumulativeInflationFactor = 1;

for (let i = 0; i <= 70 * 12; i++) {
    const interestEarned = currentBalance * monthlyRate;

    if (i > 0) {
        currentBalance += interestEarned + monthlyContribution;
        totalInvested += monthlyContribution;
        cumulativeInflationFactor *= (1 + monthlyInflation);
    }

    const realTotal = currentBalance / cumulativeInflationFactor;
    const realInvestedIncorrect = totalInvested / cumulativeInflationFactor;

    if (i % 120 === 0) {
        console.log(`Year ${i / 12} | Nom. Inv: ${totalInvested.toFixed(0)} | Real Tot: ${realTotal.toFixed(0)} | Potential Drop: ${realInvestedIncorrect.toFixed(0)}`);
    }

    if (i > 0 && totalInvested < 100000) {
        console.log("ALERT: totalInvested decreased!");
    }
}
