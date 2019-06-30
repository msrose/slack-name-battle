# slack-name-battle

[![Build Status](https://travis-ci.org/msrose/slack-name-battle.svg?branch=master)](https://travis-ci.org/msrose/slack-name-battle) 
[![codecov](https://codecov.io/gh/msrose/slack-name-battle/branch/master/graph/badge.svg)](https://codecov.io/gh/msrose/slack-name-battle)
[![Greenkeeper badge](https://badges.greenkeeper.io/msrose/slack-name-battle.svg)](https://greenkeeper.io/)
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors)

Created using the AWS SAM CLI. See [SAM.md](./SAM.md) for more details.

## Local Development

1. Clone the repo
1. Make sure you have installed and configured the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html), and installed the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
  - The SAM CLI will require you to install Docker as well, which is also needed for running local DynamoDB.
1. Run `bash local.sh`. This script starts local API Gateway on port 3000 and local DynamoDB on port 8000.
1. You can now conduct Name Battles by sending a POST request to http://localhost:3000/name-battle, with the request body `text=targetname&user_id=attackername`.
  - Local development is configured to skip Slack signature verification, and it will not hit the Slack API.

## Deployment

1. Create a [Slack app](https://api.slack.com/apps) that will serve to conduct the Name Battles.
1. Install the app in your workspace to obtain an OAuth Access Token (OAT) and a Signing Secret (SS); the app must have the `users:read` scope.
1. Create an S3 Bucket for your deployment packages: e.g. `aws s3 mb --bucket-name name-battle-deployment`
1. Run the deploy script: `TOKEN=<OAT> SIGNING_SECRET=<SS> bash deploy.sh`. It creates a CloudFormation stack called `name-battle` and assumes your deployment packages are in an S3 Bucket called `name-battle-deployment`, so change the script if your bucket is named differently.
    - NB: This script uses the default AWS profile
1. Once the stack is finished deploying, go to the [AWS Lambda Console](https://console.aws.amazon.com/lambda/) and visit the "Applications" item in the side bar to view your name-battle application. 
1. Expand the ServerlessRestApi resource and click on "API endpoint" to get the API Gateway URL for the Name Battle.
1. Update your Slack app to add a slash command which posts to the API Gateway URL. For example, call it `/name-battle`. The endpoint assumes that the first word given to the slash command is the @handle of the user who will be the target of the battle.
    - NB: You'll have to "reinstall" the Slack app after adding the slash command
1. Battle! `/name-battle @my-enemy` and watch them weep.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4" width="100px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/msrose/slack-name-battle/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/msrose/slack-name-battle/commits?author=msrose" title="Documentation">📖</a> <a href="#infra-msrose" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td><td align="center"><a href="https://github.com/apps/greenkeeper"><img src="https://avatars3.githubusercontent.com/in/505?v=4" width="100px;" alt="greenkeeper[bot]"/><br /><sub><b>greenkeeper[bot]</b></sub></a><br /><a href="#infra-greenkeeper[bot]" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td><td align="center"><a href="https://github.com/apps/allcontributors"><img src="https://avatars0.githubusercontent.com/in/23186?v=4" width="100px;" alt="allcontributors[bot]"/><br /><sub><b>allcontributors[bot]</b></sub></a><br /><a href="https://github.com/msrose/slack-name-battle/commits?author=allcontributors[bot]" title="Documentation">📖</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
