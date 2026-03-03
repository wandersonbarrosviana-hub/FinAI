import yahooFinance from "npm:yahoo-finance2";

async function test() {
    try {
        const result = await yahooFinance.historical('ITUB4.SA', {
            period1: '2020-01-01',
            events: 'div'
        });
        console.log("Dividends result length:", result.length);
        if (result.length > 0) {
            console.log(result[0]);
        }
    } catch(e) {
        console.error("Error div:", e.message);
    }
    
    try {
        const summary = await yahooFinance.quoteSummary('ITUB4.SA', { 
            modules: ['defaultKeyStatistics', 'financialData'] 
        });
        console.log("Summary:", summary.financialData ? "has financial" : "no");
    } catch(e) {
        console.error("Error summary:", e);
    }
}
test();
