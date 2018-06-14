const mintConfig = require('../test-config').mint
const mint = new require('../src/mint/mint')(mintConfig)

let expensifyConfig = require('../test-config').expensify
const expensify = new require('../src/expensify/expensify')(expensifyConfig)

let minty = new require('../src/index')(mint, expensify)
let comparator = new require('../src/expenseToTransactionComparator')()

let chai = require('chai');

chai.should();

describe('mint-expensified', function () {
  it('should match like expenses and transactions', async function () {
    this.timeout(30000);
    await mint.init()

    let newExpenses = [
      {
        date: "2000-01-01",
        currency: "USD",
        merchant: "Test Merchant Name",
        amount: 1234
      }
    ]

    let newTransaction = {
      amount: 12.34,
      date: "01/01/2000",
      merchant: "Test Merchant Name"
    };

    let expenses = await createAndGetReportExpenses(newExpenses);
    let allTrans = await createAndGetAllTransactions(newTransaction);
    await deleteTransactions(allTrans);

    let matchResults = minty.getMatchResults(allTrans, expenses)[0]

    let expenseMatch = matchResults.expense
    let transactionMatch = matchResults.matchingTransactions[0]

    matchResults.matchingTransactions.should.have.lengthOf(1)
    /**
     * TODO: Would be nice to be able to compare newly created expenses/transactions to the matches here however the
     * TODO:   model for objects passed in is slightly different such as the format of the date, expense.date instead
     * TODO:   of expense.created, etc. This might be a good argument for making consistent expense and transaction
     * TODO:   model types.
     */
    comparator.areEqual(transactionMatch, expenseMatch).should.equal(true)
  })

  it('should update transactions with matching expenses', async function () {
    this.timeout(30000);
    await mint.init()
    await minty.init()

    let newExpenses = [
      {
        date: "2000-01-01",
        currency: "USD",
        merchant: "Test Merchant Name",
        amount: 1234
      }
    ]

    let newTransaction = {
      amount: 12.34,
      date: "01/01/2000",
      merchant: "Test Merchant Name"
    };

    let expenses = await createAndGetReportExpenses(newExpenses)
    let allTrans = await createAndGetAllTransactions(newTransaction)

    let matchResult = (await minty.tagMatchingTransactions(allTrans, expenses))[0]
    let updatedTrans = (await getAllTransactions())[0]
    await deleteTransactions(allTrans);

    let expenseMatch = matchResult.expense
    let transactionMatch = matchResult.matchingTransactions[0]

    matchResult.matchingTransactions.should.have.lengthOf(1)
    /**
     * TODO: Would be nice to be able to compare newly created expenses/transactions to the matches here however the
     * TODO:   model for objects passed in is slightly different such as the format of the date, expense.date instead
     * TODO:   of expense.created, etc. This might be a good argument for making consistent expense and transaction
     * TODO:   model types.
     */
    comparator.areEqual(transactionMatch, expenseMatch).should.equal(true)
    // TODO: Right now "Vacation" is hardcoded here as well as in the class under test. This should be fixed.
    updatedTrans.labels.filter((trans) => trans.name === "Vacation").should.have.lengthOf(1)
  })
});

async function createAndGetReportExpenses(expensesToCreate) {
  let requestInputs = {
    inputSettings: {
      expenses: expensesToCreate
    }
  }

  let newReport = await expensify.createReport(requestInputs)

  requestInputs = {
    inputSettings: {
      type: "combinedReportData",
      filters: {
        reportIDList: newReport.reportID
      }
    }
  }

  return await expensify.getReport(requestInputs)
}

async function createAndGetAllTransactions(createTransactionRequest) {
  await mint.createTransaction(createTransactionRequest)
  return await getAllTransactions();
}

async function getAllTransactions() {
  let foo = {
    // Started at TW in April
    startDate: "01/01/1900",
    endDate: "01/01/9999"
  }

  return await mint.getTransactions(foo)
}

async function deleteTransactions(allTrans) {
  await Promise.all(allTrans.map(async (trans) => {
    await mint.deleteTransaction(trans.id)
  }))
}
