const expensifyConfig = require('./config').expensify
let request = require('request-promise-native');
let fs = require('fs');

async function getAllExpenses() {
  /**
   * TODO: https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_matches
   * TODO:   See above for things that can be done in the template such as escaping values for json, decoding
   * TODO:   html entities (debatable if we want to do this in freemarker or here) and other useful tools.
   */
  let reportTemplate = fs.readFileSync('expensify_template.ftl', 'utf8')
  let form = getReportExportForm(reportTemplate);

  let fileName = await request(getExpensifyRequest(form));
  let body = await downloadExpensifyReport(fileName)
  return JSON.parse(body)
}

async function downloadExpensifyReport(fileName) {
  let form = getReportDownloadForm(fileName);

  return await request(getExpensifyRequest(form));
}

function getExpensifyRequest(form) {
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

module.exports = {getAllExpenses}
