// const mintConfig = require('./test-config').mint
// const expensifyConfig = require('./test-config').expensify
const mintConfig = require('./config').mint
const expensifyConfig = require('./config').expensify
// TODO: There's a promise-based request library too we might want to try using
let request = require('request')
let fs = require('fs');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();


function main() {
  // TODO: https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_matches
  // TODO:  See above for things that can be done in the template such as escaping values for json, decoding
  // TODO:  html entities (debatable if we want to do this in freemarker or here) and other useful tools.
  let reportTemplate = fs.readFileSync('expensify_template.ftl', 'utf8')
  let form = getReportExportForm(reportTemplate);

  request(
    getExpensifyRequest(form),
    downloadExpensifyReport
  );
}

function downloadExpensifyReport(error, response, body) {
  let form = getReportDownloadForm(body);

  request(
    getExpensifyRequest(form),
    searchMint
  );
}

// TODO: Mint search queries can match on categories too. Need to verify an expense doesn't have the same name as a category
// TODO:  NOTE that above will NOT be an issue if we bulk download transactions via a broad search or export first since we can do exact matches
async function searchMint(error, response, body) {
  let expenses = JSON.parse(body)
  // console.log(expenses)
  let mint = await require('pepper-mint')(mintConfig.username, mintConfig.password, mintConfig.ius_session, mintConfig.thx_guid)
  let allTrans = await getAllTransactions(mint, 0)
  await expenses.map(async (expense) => {
    let transactionSearchResults = allTrans.filter((transaction) => {
      return areEqual(transaction, expense)
    })
    if (expense.amount !== expense.modifiedAmount && expense.modifiedAmount !== "") {
      console.log("Expense with a modified amount. This likely means that it was only partially reimbursed and you should split this transaction in mint")
      console.log(expense)
    }
    if (transactionSearchResults.length > 1) {
      // TODO: We need to handle expenses which have multiple matching transactions. This is somewhat valid. If something
      // TODO:   is purchased from the same merchant, on the same day, for the same amount then this will occur. I believe
      // TODO:   the best solution here is to simply iterate over these transactions and tag them as reimbursable. The only downside
      // TODO:   is that these transactions will get updated twice each which isn't a big deal.
      console.log("Expense with multiple matching transactions")
      console.log(expense)
      console.log(transactionSearchResults)
    } else if (transactionSearchResults.length < 1) {
      // TODO: This is generally bad. However, currently there are a lot of manually created expenses for monthly allowances (internet, phone, etc)
      // TODO:   Find a way to finder out these known expenses so that this shows legitimate cases where there was no match
      console.log("No matching transaction found for expense: ")
      console.log(`Expected 1 result but got ${transactionSearchResults.length}`)
      console.log(expense)
    }
  })
}

function getTransactions(mint, expense) {
  return mint.getTransactions(getTransactionsQuery(expense))
}

async function getAllTransactions(mint, offset) {
  let allT = []
  let iterate = function (txns) {
    let proceed = true;
    if (txns) {
      txns.forEach(function (txn) {
        console.log(txn.date, txn.merchant, txn.amount);
        allT.push(txn)
      });

      if (txns.length) {
        offset += txns.length;
      } else {
        proceed = false;
      }
    }

    if (proceed) {
      return mint.getTransactions(getAllTransactionsQuery(offset)).then(iterate);
      // return mint.getTransactions(args).then(iterate);
    }
  }
  // return mint.getTransactions(getAllTransactionsQuery(offset))
  await iterate()
  return allT
}

// Sanity check
function areEqual(transaction, expense) {
  // TODO: Getting pretty hacky here with the decode. We should probably transform to our own models before doing comparisons?
  return transaction.omerchant.toUpperCase() === entities.decode(expense.merchant).toUpperCase()
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


function getTransactionsQuery(expense) {
  return {
    query: [
      expense.merchant
    ],
    // Format dates how mint api expects them
    startDate: expense.created.replace(/(\d+)-(\d+)-(\d+)/, "$2/$3/$1"),
    endDate: expense.created.replace(/(\d+)-(\d+)-(\d+)/, "$2/$3/$1")
  };
}

function getAllTransactionsQuery(offset) {
  return {
    offset: offset,
    query: [],
    // Started at TW in April
    startDate: "04/02/2017",
    endDate: "01/01/9999"
  };
}

function getExpensifyRequest(form) {
  return {
    url: 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations',
    method: 'POST',
    body: form,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
}

function getReportExportForm(reportTemplate) {
  let reportExport = require('./report_export')
  reportExport.credentials.partnerUserID = expensifyConfig.partnerUserID
  reportExport.credentials.partnerUserSecret = expensifyConfig.partnerUserSecret
  let form = 'requestJobDescription=' + JSON.stringify(reportExport)
  form = form.concat('&template=' + encodeURIComponent(reportTemplate))
  return form;
}

function getReportDownloadForm(fileName) {
  let reportDownload = require('./report_download')
  reportDownload.credentials.partnerUserID = expensifyConfig.partnerUserID
  reportDownload.credentials.partnerUserSecret = expensifyConfig.partnerUserSecret
  reportDownload.fileName = fileName
  return 'requestJobDescription=' + JSON.stringify(reportDownload);
}


main()
