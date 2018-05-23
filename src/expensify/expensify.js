let request = require('request-promise-native');
let fs = require('fs');
let expensifyConfig

/**
 * TODO: https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_matches
 * TODO:   See above for things that can be done in the template such as escaping values for json, decoding
 * TODO:   html entities (debatable if we want to do this in freemarker or here) and other useful tools.
 */
const EXPENSIFY_TEMPLATE_PATH = 'src/expensify/expensify_template.ftl';

Expensify.prototype.createReport = async function (requestInputs) {
  let requestName = 'report_create'
  let exportReportRequest = loadExpensifyRequest(requestName)
  updateRequestInputSettings(exportReportRequest, requestInputs)
  addCredentialsToRequest(exportReportRequest)
  addSpecialPropertiesToRequest(exportReportRequest)
  let form = createExpensifyForm(exportReportRequest)
  let expensifyRequest = createExpensifyRequest(form)
  let expensifyResponse = await sendExpensifyRequest(expensifyRequest)
  return JSON.parse(expensifyResponse)
}

Expensify.prototype.getReport = async function (requestInputs) {
  // TODO: Parse exportReport response for errors
  let exportedReportName = await exportReport(requestInputs);
  let expensifyResponse = await downloadReport(exportedReportName);
  return JSON.parse(expensifyResponse)
}

Expensify.prototype.getAllExpenses = async function () {
  let requestInputs = {
    inputSettings: {
      type: "combinedReportData",
      filters: {
        startDate: "2000-01-01"
      }
    }
  }
  return this.getReport(requestInputs)
}

function exportReport(requestInputs) {
  let requestName = 'report_export'
  let exportReportRequest = loadExpensifyRequest(requestName)
  updateRequestInputSettings(exportReportRequest, requestInputs)
  addCredentialsToRequest(exportReportRequest)
  let form = createExpensifyForm(exportReportRequest)
  form = addTemplateParamToForm(form)
  let expensifyRequest = createExpensifyRequest(form)
  return sendExpensifyRequest(expensifyRequest)
}

async function downloadReport(exportedReportName) {
  let requestName = 'report_download'
  let downloadReportRequest = loadExpensifyRequest(requestName)
  updateRequest(downloadReportRequest, {fileName: exportedReportName})
  addCredentialsToRequest(downloadReportRequest)
  let form = createExpensifyForm(downloadReportRequest)
  let expensifyRequest = createExpensifyRequest(form)
  return await sendExpensifyRequest(expensifyRequest);
}

function addTemplateParamToForm(form) {
  let reportTemplate = fs.readFileSync(EXPENSIFY_TEMPLATE_PATH, 'utf8')
  return form.concat('&template=' + encodeURIComponent(reportTemplate))
}

function sendExpensifyRequest(expensifyRequest) {
  return request(expensifyRequest)
}

function createExpensifyForm(request) {
  return 'requestJobDescription=' + JSON.stringify(request);
}

function addCredentialsToRequest(request) {
  request.credentials.partnerUserID = expensifyConfig.partnerUserID
  request.credentials.partnerUserSecret = expensifyConfig.partnerUserSecret
}
function addSpecialPropertiesToRequest(request) {
  /**
   * TODO: policyId and employeeEmail required for create but not others. These are not required for all types of
   * TODO:   requests which can lead to unexpected behavior. For instance you can't ask for OPEN reports (see docs)
   */
  request.inputSettings.policyID = expensifyConfig.policyID
  request.inputSettings.employeeEmail = expensifyConfig.employeeEmail
}

function updateRequestInputSettings(request, updates) {
  Object.assign(request.inputSettings, updates.inputSettings)
}

function updateRequest(request, updates) {
  Object.assign(request, updates)
}

function createExpensifyRequest(form) {
  return {
    url: 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations',
    method: 'POST',
    body: form,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
}

function loadExpensifyRequest(requestName) {
  return require(`./${requestName}`)
}

function Expensify() {}

function init(config) {
  expensifyConfig = config
  return new Expensify()
}

module.exports = init
