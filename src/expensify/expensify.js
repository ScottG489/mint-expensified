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

  let requestName = 'report_download'
  let downloadReportRequest = loadExpensifyRequest(requestName)
  updateRequest(downloadReportRequest, {fileName: exportedReportName})
  addCredentialsToRequest(downloadReportRequest)
  let form = createExpensifyForm(downloadReportRequest)
  let expensifyRequest = createExpensifyRequest(form)
  let expensifyResponse = await sendExpensifyRequest(expensifyRequest)
  return JSON.parse(expensifyResponse)
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

Expensify.prototype.getAllExpenses = async function () {
  let fileName = await exportAllReports();
  let body = await downloadExpensifyReport(fileName)
  return JSON.parse(body)
}

async function exportAllReports() {
  let reportTemplate = fs.readFileSync(EXPENSIFY_TEMPLATE_PATH, 'utf8')
  let form = getReportExportForm(reportTemplate);

  return await request(createExpensifyRequest(form));
}

async function downloadExpensifyReport(fileName) {
  let form = getReportDownloadForm(fileName);

  return await request(createExpensifyRequest(form));
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

function loadExpensifyRequest(requestName) {
  return require(`./${requestName}`)
}

function Expensify() {}

function init(config) {
  expensifyConfig = config
  return new Expensify()
}

module.exports = init
