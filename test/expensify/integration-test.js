const expensify = require('../../src/expensify/expensify')
const Joi = require('joi')
const chai = require('chai');
const expect = chai.expect

chai.should();

/**
 * TODO: Test setup/flow:
 * TODO:   1. Create report with expenses
 * TODO:   2. Get all expenses using search criteria (unique report id?)
 * TODO:   3. Assertions
 * TODO:   Since we can't delete via the api then we have to make sure #2 only gets reports/expenses for this test
 */
describe('expensify', function () {
  it('should create a report', async function () {
    let expenses = [
      {
        date: "2000-01-01",
        currency: "USD",
        merchant: "Name of merchant",
        amount: 1234
      },
      {
        date: "2000-01-01",
        currency: "USD",
        merchant: "Name of merchant",
        amount: 4321
      }
    ]

    let requestInputs = {
      inputSettings: {
        expenses: expenses
      }
    }

    let newReport = await expensify.createReport(requestInputs)

    validateSchema(
      newReport,
      Joi.object().keys({
        reportID: Joi.string().regex(/^[0-9]*$/),
        reportName: "",
        responseCode: 200
      }));
  })
});

function validateSchema(actual, expectedSchema) {
  expect(Joi.validate(actual, expectedSchema.required()).error).to.be.null
}

