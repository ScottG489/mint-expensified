let minty = require('../index')
let chai = require('chai');

const mintConfig = require('./test-config').mint


chai.should();

describe('mint-expensified', function () {
  it('runs', async function () {
    // TODO: Have this actually assert something
    let foo = await minty()
  })
});
