const mintConfig = require('../test-config').mint
const mint = new require('../src/mint/mint')(mintConfig)

let expensifyConfig = require('../test-config').expensify
const expensify = new require('../src/expensify/expensify')(expensifyConfig)

let matcher = new require('../src/matcher')(mint, expensify)

async function main() {
  await mint.init()
  await matcher.init()
  let allExpenses = expensify.getAllExpenses()
  let allTrans = mint.getAllTransactions()
  let matchResults = matcher.getMatchResults(await allTrans, await allExpenses)

  printExpensesWithNoMatchingTransactions(matchResults)
  printExpensesWithModifiedAmount(matchResults)
  printMatchResults(matchResults)
}

function printMatchResults(matchResults) {
  console.log("All expenses with matching transaction(s) (if any):")

  matchResults.forEach((result) => {
    console.log(result.expense.merchant + " | " + result.expense.amount + " | " + result.expense.created)
    result.matchingTransactions.forEach((transaction) => {
      console.group()
      console.log(transaction.omerchant + " | " + transaction.odate + " | " + transaction.amount)
      console.groupEnd()
    })
  })
  console.log()
}

function printExpensesWithNoMatchingTransactions(matchResults) {
  console.log("No matching transaction found for expenses:")

  console.group()
  matchResults
    .filter((result) => {
      return result.matchingTransactions.length === 0
    })
    .forEach((result) => {
    console.log(result.expense.merchant + " | " + result.expense.amount + " | " + result.expense.created)
  })
  console.groupEnd()
  console.log()
}

function printExpensesWithModifiedAmount(matchResults) {
  console.log("Expenses with a modified amount. This likely means that it was only partially reimbursed and you should split this transaction in mint")

  console.group()
  matchResults
    .filter((result) => {
      return result.expense.modifiedAmount !== "" && result.expense.amount !== result.expense.modifiedAmount
    })
    .forEach((result) => {
      console.log(result.expense.merchant + " | " + result.expense.amount + " | " + result.expense.created)
    })
  console.groupEnd()
  console.log()
}

main()
