const peppermint = require('pepper-mint')
let mintConfig
let pm

// TODO: These should not be hardcoded
const TRANSACTIONS_START_DATE = "04/02/2017"
const TRANSACTIONS_END_DATE = "01/01/9999"

Mint.prototype.getAllTransactions = async function() {
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
      return pm.getTransactions(getAllTransactionsQuery(startingOffset)).then(iterate);
    }
  }

  await iterate()
  return allT
}

Mint.prototype.createTransaction = async function(args) {
  return await pm.createTransaction(args)
}

Mint.prototype.deleteTransaction = async function(args) {
  return await pm.deleteTransaction(args)
}

Mint.prototype.getTransactions = async function(args) {
  return await pm.getTransactions(args)
}

Mint.prototype.editTransaction = async function(args) {
  return await pm.editTransaction(args)
}

Mint.prototype.getTags = async function() {
  return await pm.getTags()
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
// TODO: I don't like how you need to call init() after class instantiation
Mint.prototype.init = async function() {
  pm = await peppermint(mintConfig.username, mintConfig.password, mintConfig.ius_session, mintConfig.thx_guid)
}

function init(config) {
  mintConfig = config
  return new Mint()
}

module.exports = init
