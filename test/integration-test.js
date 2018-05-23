let minty = require('../src/index')
let chai = require('chai');

const mintConfig = require('../test-config').mint


chai.should();

describe('mint-expensified', function () {
  xit('runs', async function () {
    this.timeout(30000);
    // TODO: Have this actually assert something
    let foo = await minty()
  })
});
