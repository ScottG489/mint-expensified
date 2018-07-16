<#compress>
[
    <#list reports as report>
        <#list report.transactionList as expense>
{
        "merchant": "${expense.merchant}",
        "amount": "${expense.amount}",
        "created": "${expense.created}",
        "modifiedMerchant": "${expense.modifiedMerchant}",
        "modifiedAmount": "${expense.modifiedAmount}",
        "modifiedCreated": "${expense.modifiedCreated}",
        "reimbursable": ${expense.reimbursable?string("true", "false")},
        "reportName": "${report.reportName}"
}<#if expense?has_next>,</#if>

        </#list>
        <#if report?has_next><#if report.transactionList?has_content>,</#if></#if>
    </#list>
]</#compress>