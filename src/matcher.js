let comparator = new require('../src/expenseToTransactionComparator')()

let mint
let expensify
let allTags

Matcher.prototype.tagMatchingTransactions = async function (allTrans, allExpenses) {
  return await Promise.all(
    this.getMatchResults(allTrans, allExpenses)
    .map(async (results) => {
     /**
      * TODO: Just because the amount was altered does this mean we never want to update any potentially matching
      * TODO:   transactions? If a transaction is split so that the amount is correct then it should match correctly
      * TODO:   and rightly be updated as being reimbursed. Verify that all modified amount expenses also don't have
      * TODO:   any matches (as this is expected) and then only call them out as a problem if they have a modified
      * TODO:   amount AND no matching transaction as this is really what indicates that they are in need of being
      * TODO:   split in mint. Once they are split, they should match like any other transaction and we don't really
      * TODO:   care that they were ever modified as expenses.
      */
      if (!results.expenseAmountWasAltered) {
        let tag = allTags.find((tag) => {
          // TODO: This shouldn't be hardcoded
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

Matcher.prototype.getMatchResults = function(allTrans, allExpenses) {
  return allExpenses
    .filter((expense) => {
      // TODO: This shouldn't be hardcoded
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

function Matcher() {}
// TODO: I don't like how you need to call init() after class instantiation
Matcher.prototype.init = async function() {
  allTags = await mint.getTags()
}

function init(mintClient, expensifyClient) {
  mint = mintClient
  expensify = expensifyClient
  return new Matcher()
}

module.exports = init
