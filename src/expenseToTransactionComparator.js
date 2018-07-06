const entities = new require('html-entities').XmlEntities;

ExpenseToTransactionComparator.prototype.areEqual = function(transaction, expense) {
  // TODO: We should probably transform to our own models before doing comparisons for simplicity?
  return normalizeTransactionMerchant(transaction.omerchant) === normalizeExpenseMerchant(expense.merchant)
    && normalizeTransactionDate(transaction.odate) === expense.created
    /**
     * TODO: Do we actually want to compare on modified amount if it's been set? I believe we do because if there is a
     * TODO:   modified amount then this means it is the amount which was actually reimbursed and is what the split
     * TODO:   transaction should be in mint which we want to match against. Otherwise, I don't think any expenses
     * TODO:   will ever match which have a modified amount since we never look at it when trying to match.
     * */
    && normalizeTransactionAmount(transaction.amount) === expense.amount
}

function normalizeTransactionMerchant(transactionMerchant) {
  return transactionMerchant
    // Expenses imported into expensify from credit card seem to be made all uppercase
    .toUpperCase()
    // Expenses seemed to have extra spaces/whitespace truncated down to one space
    .replace(/\s\s+/g, ' ')
    // Expenses seemed to be truncated down to 32 characters
    .substring(0, 32)
}

function normalizeExpenseMerchant(expenseMerchant) {
  return entities
    // Expenses seemed to be html encoded
    .decode(expenseMerchant)
    // Expenses imported into expensify from credit card seem to be made all uppercase
    .toUpperCase()
}

function normalizeTransactionDate(dateString) {
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

function normalizeTransactionAmount(transactionAmount) {
  // Formatted dollar amount ($1,234.56) to cents
  return transactionAmount.replace(/[$.,]/g, "");
}

function ExpenseToTransactionComparator() {}

function init() {
  return new ExpenseToTransactionComparator()
}

module.exports = init
