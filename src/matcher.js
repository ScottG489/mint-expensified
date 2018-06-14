let comparator = new require('../src/expenseToTransactionComparator')()

let mint
let expensify
let allTags

Matcher.prototype.tagMatchingTransactions = async function (allTrans, allExpenses) {
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

Matcher.prototype.getMatchResults = function(allTrans, allExpenses) {
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
