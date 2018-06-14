let comparator = new require('../src/expenseToTransactionComparator')()

let mint
let expensify
let allTags

// async function main() {
//   let allExpenses = expensify.getAllExpenses()
//   let allTrans = mint.getAllTransactions()
//   let tags = await mint.getTags()
//   let matches = getMatchResults(await allTrans, await allExpenses)
//   return match(await allTrans, await allExpenses)
// }

Minty.prototype.tagMatchingTransactions = async function (allTrans, allExpenses) {
  return await Promise.all(
    this.getMatchResults(allTrans, allExpenses)
    .map(async (results) => {
      if (!results.expenseAmountWasAltered) {
        let tag = allTags.find((tag) => {
          return tag.value === "Vacation"
        })

        await Promise.all(results.matchingTransactions.map(async (transaction) => {
            return await mint.editTransaction({
              id: transaction.id,
              tags: [tag.id]
            })
          })
        )
      }

      return results
    })
  )
}

Minty.prototype.getMatchResults = function(allTrans, allExpenses) {
  return allExpenses
    .filter((expense) => {
      return !expense.reportName.endsWith("Transit/Mobile/Internet")
    })
    .map((expense) => {
      let transactionSearchResults = allTrans.filter((transaction) => {
        return comparator.areEqual(transaction, expense)
      })

      return {
        expense: expense,
        matchingTransactions: transactionSearchResults,
        expenseAmountWasAltered: expense.modifiedAmount !== "" && expense.amount !== expense.modifiedAmount
      }
    })
}

async function match(allTrans, allExpenses) {
  return allExpenses
    .filter((expense) => {
      return !expense.reportName.endsWith("Transit/Mobile/Internet")
    })
    .map((expense) => {
      let transactionSearchResults = allTrans.filter((transaction) => {
        return comparator.areEqual(transaction, expense)
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


function Minty() {}
// TODO: I don't like how you need to call init() after class instantiation
Minty.prototype.init = async function() {
  allTags = await mint.getTags()
}

function init(mintClient, expensifyClient) {
  mint = mintClient
  expensify = expensifyClient
  return new Minty()
}

module.exports = init
