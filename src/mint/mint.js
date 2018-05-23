const peppermint = require('pepper-mint')
let mintConfig

const TRANSACTIONS_START_DATE = "04/02/2017"
const TRANSACTIONS_END_DATE = "01/01/9999"

Mint.prototype.getAllTransactions = async function() {
  let mint = await peppermint(mintConfig.username, mintConfig.password, mintConfig.ius_session, mintConfig.thx_guid)
  let startingOffset = 0
  let allT = []
  let iterate = function (txns) {
    let proceed = true;
    if (txns) {
      txns.forEach(function (txn) {
        allT.push(txn)
      });

      if (txns.length) {
        startingOffset += txns.length;
      } else {
        proceed = false;
      }
    }

    if (proceed) {
      return mint.getTransactions(getAllTransactionsQuery(startingOffset)).then(iterate);
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

function Mint() {}

function init(config) {
  mintConfig = config
  return new Mint()
}

module.exports = init
