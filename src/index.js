const mintConfig = require('../config').mint
const mint = new require('./mint/mint')(mintConfig)

// let expensifyConfig = require('../test-config').expensify
let expensifyConfig = require('../config').expensify
// TODO: I believe this is causing 'npm test' to fail and im not sure why
const expensify = new require('./expensify/expensify')(expensifyConfig)

const entities = new require('html-entities').XmlEntities;

async function main() {
  let allExpenses = expensify.getAllExpenses()
  let allTrans = mint.getAllTransactions()
  return match(await allTrans, await allExpenses)
}

async function match(allTrans, allExpenses) {
  return await allExpenses.map((expense) => {
    let transactionSearchResults = allTrans.filter((transaction) => {
      return areEqual(transaction, expense)
    })
    if (expense.modifiedAmount !== "" && expense.amount !== expense.modifiedAmount) {
      console.log("Expense with a modified amount. This likely means that it was only partially reimbursed and you should split this transaction in mint")
      console.log(expense)
    }
    if (transactionSearchResults.length > 1) {
      /**
       * TODO: We need to handle expenses which have multiple matching transactions. This is somewhat valid. If something
       * TODO:   is purchased from the same merchant, on the same day, for the same amount then this will occur. I believe
       * TODO:   the best solution here is to simply iterate over these transactions and tag them as reimbursable. The only downside
       * TODO:   is that these transactions will get updated twice each which isn't a big deal.
       */
      console.log("Expense with multiple matching transactions")
      console.log(expense)
      console.log(transactionSearchResults)
    } else if (transactionSearchResults.length < 1) {
      /**
       * TODO: This is generally bad. However, currently there are a lot of manually created expenses for monthly allowances (internet, phone, etc)
       * TODO:   Find a way to filter out these known expenses so that this shows legitimate cases where there was no match
       */
      console.log("No matching transaction found for expense: ")
      console.log(`Expected 1 result but got ${transactionSearchResults.length}`)
      console.log(expense)
    }
    return expense
  })
}

// Sanity check
function areEqual(transaction, expense) {
  // TODO: Getting pretty hacky here with the decode. We should probably transform to our own models before doing comparisons?
  return transaction.omerchant.toUpperCase().replace(/\s\s+/g, ' ').substring(0, 32) === entities.decode(expense.merchant).toUpperCase()
    && formatDate(transaction.odate) === expense.created
    && transaction.amount.replace(/[$.,]/g, "") === expense.amount
}

function formatDate(dateString) {
  if (!dateString.includes('/')) {
    return formatFromCurrentYearStyle(dateString)
  }
  let date = new Date(dateString)
  let year = date.getFullYear().toString()
  let month = padLeadingZero(date.getMonth() + 1)
  let day = padLeadingZero(date.getDate())
  return `${year}-${month}-${day}`
}

// This handles dates formatted such as "May 4" where the current year is assumed
function formatFromCurrentYearStyle(currentYearStyledDate) {
  // TODO: Parsing a date free form like this is a bad idea and discouraged in docs
  let date = new Date(currentYearStyledDate)
  date.setFullYear(new Date().getFullYear())
  let year = date.getFullYear().toString()
  let month = padLeadingZero(date.getMonth() + 1)
  let day = padLeadingZero(date.getDate())
  return `${year}-${month}-${day}`
}

function padLeadingZero(number) {
  return `0${number.toString()}`.slice(-2)
}

module.exports = main
