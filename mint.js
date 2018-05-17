const mintConfig = require('./config').mint
const peppermint = require('pepper-mint')

const TRANSACTIONS_START_DATE = "04/02/2017"
const TRANSACTIONS_END_DATE = "01/01/9999"

async function getAllTransactions(offset) {
  let mint = await peppermint(mintConfig.username, mintConfig.password, mintConfig.ius_session, mintConfig.thx_guid)
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
    }
  }

  await iterate()
  return allT
}

function getAllTransactionsQuery(offset) {
  return {
    offset: offset,
    query: [],
    // Started at TW in April
    startDate: TRANSACTIONS_START_DATE,
    endDate: TRANSACTIONS_END_DATE
  };
}

module.exports = {getAllTransactions}
