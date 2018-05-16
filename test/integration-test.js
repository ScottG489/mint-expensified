let minty = require('../index')
let chai = require('chai');

const mintConfig = require('./test-config').mint


chai.should();

describe('mint-expensified', function () {
  it('runs', function () {
    // TODO: Why does this just seem to return and pass instantly? Some kind of promise magic...
    minty()
  })
});
