// TODO: Inject config into this instead of it being hardcoded
const expensifyConfig = require('../../test-config').expensify
let request = require('request-promise-native');
let fs = require('fs');

/**
 * TODO: https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_matches
 * TODO:   See above for things that can be done in the template such as escaping values for json, decoding
 * TODO:   html entities (debatable if we want to do this in freemarker or here) and other useful tools.
 */
const EXPENSIFY_TEMPLATE_PATH = 'src/expensify/expensify_template.ftl';

function createReport(requestInputs) {
  let requestName = 'report_create'
  let exportReportRequest = loadExpensifyRequest(requestName)
  updateRequestInputSettings(exportReportRequest, requestInputs)
  addCredentialsToRequest(exportReportRequest)
  let form = createExpensifyForm(exportReportRequest)
  let expensifyRequest = createExpensifyRequest(form)
  return sendExpensifyRequest(expensifyRequest)
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
  // TODO: policyId and employeeEmail aren't really part of "credentials"
  request.inputSettings.policyID = expensifyConfig.policyID
  request.inputSettings.employeeEmail = expensifyConfig.employeeEmail
}

function updateRequestInputSettings(request, updates) {
  Object.assign(request.inputSettings, updates)
}

async function getAllExpenses() {
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

module.exports = {getAllExpenses, createReport}
