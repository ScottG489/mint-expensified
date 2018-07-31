const mintConfig = require('../config').mint
const mint = new require('../src/mint/mint')(mintConfig)

let expensifyConfig = require('../config').expensify
const expensify = new require('../src/expensify/expensify')(expensifyConfig)

let matcher = new require('../src/matcher')(mint, expensify)

let args = require('commander');

args
  .version('0.1.0')
  .option('-n, --no-update', "Don't update transactions")
  .parse(process.argv)

async function main() {
  await mint.init()
  await matcher.init()
  let allExpenses = expensify.getAllExpenses()
  let allTrans = mint.getAllTransactions()

  let tagName = "Reimbursable"
  let matchResults
  if (args.update) {
    matchResults = await matcher.tagMatchingTransactions(await allTrans, await allExpenses, tagName)
  } else {
    matchResults = matcher.getMatchResults(await allTrans, await allExpenses)
  }

  printExpensesWithNoMatchingTransactions(matchResults)
  printExpensesWithModifiedAmountAndNoMatchingTransactions(matchResults)
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
  console.log("No matching transaction found for expenses whos amounts haven't been modified. This likely means there is something wrong with the transaction/expense that needs to be investigated:")

  console.group()
  matchResults
    .filter((result) => {
      return result.matchingTransactions.length === 0 && result.expenseAmountWasAltered === false
    })
    .forEach((result) => {
    console.log(result.expense.merchant + " | " + result.expense.amount + " | " + result.expense.created)
  })
  console.groupEnd()
  console.log()
}

function printExpensesWithModifiedAmountAndNoMatchingTransactions(matchResults) {
  console.log("Expenses with no matching transactions and a modified amount. This likely means that it was only partially reimbursed and you should split this transaction in mint")

  console.group()
  matchResults
    .filter((result) => {
      return result.expenseAmountWasAltered && result.matchingTransactions.length === 0
    })
    .forEach((result) => {
      console.log(result.expense.merchant + " | " + result.expense.amount + " | " + result.expense.modifiedAmount + " | " + result.expense.created)
    })
  console.groupEnd()
  console.log()
}

main()
