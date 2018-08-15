# mint-expensified
## Getting started
### Create your config
Create a file called `config.json` in the root directory of your project with a structure as seen below.
```json
{
  "mint": {
    "username": "<mint username>",
    "password": "<mint password>",
    "ius_session": "<mint ius_session>",
    "thx_guid": "<mint thx_guid>"
  },
  "expensify": {
    "partnerUserID": "<expensify partner user id>",
    "partnerUserSecret": "<expensify partner user secret>",
    "employeeEmail": "<expensify employee email>",
    "policyID": "<expensify policy id>"
  }
}
```
| Field        | Description           | Required  |
|:------------:|:---------------------:|:---------:|
| `mint.username` | Your [mint.com](https://www.mint.com/) username | Yes
| `mint.password` | Your [mint.com](https://www.mint.com/) password | Yes
| `mint.ius_session` | See [here](https://github.com/dhleong/pepper-mint#mint-cookie) on how to obtain your ius_session cookie | Yes
| `mint.thx_guid` | See [here](https://github.com/dhleong/pepper-mint#mint-cookie) on how to obtain your thx_guid cookie | Yes
| `expensify.partnerUserID` | See [Expensify's documentation](https://integrations.expensify.com/Integration-Server/doc/) | Yes
| `expensify.partnerUserSecret` | See [Expensify's documentation](https://integrations.expensify.com/Integration-Server/doc/) | Yes
| `expensify.employeeEmail` | Required by tests to create expensify reports | No (only used in tests)
| `expensify.policyID` | Required by tests to create expensify reports | No (only used in tests)
### Running
I would suggest initially doing a "dry run" as so:

`node src/index.js --no-update`

This prints out information about mint transactions it has found matches for against expensify expenses.
Once you're comfortable having the app tag your transactions in mint, simply run without the `--no-updates` flag.
See `--help` for more info.
