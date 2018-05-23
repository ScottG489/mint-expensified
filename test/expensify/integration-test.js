let expensifyConfig = require('../../test-config').expensify
const expensify = new require('../../src/expensify/expensify')(expensifyConfig)
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
    this.timeout(30000);
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

  it('should find a created report', async function () {
    this.timeout(30000);
    let expenses = [
      {
        date: "2000-01-01",
        currency: "USD",
        merchant: "Name of merchant",
        amount: 1234
      }
    ]

    let requestInputs = {
      inputSettings: {
        expenses: expenses
      }
    }

    let newReport = await expensify.createReport(requestInputs)

    requestInputs = {
      inputSettings: {
        type: "combinedReportData",
        limit: "30",
        filters: {
          reportIDList: newReport.reportID
        }
      }
    }

    let report = await expensify.getReport(requestInputs)

    validateSchema(
      report[0],
      Joi.object().keys({
        merchant: expenses[0].merchant,
        amount: expenses[0].amount,
        // TODO: Why does this pass? Should we parse it as a number?
        created: expenses[0].date,
        modifiedMerchant: "",
        modifiedAmount: "",
        modifiedCreated: "",
        reportName: "New Report"
      }));
  })
});

function validateSchema(actual, expectedSchema) {
  expect(Joi.validate(actual, expectedSchema.required()).error).to.be.null
}

