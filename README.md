# slack-name-battle

[![Build Status](https://travis-ci.org/msrose/slack-name-battle.svg?branch=master)](https://travis-ci.org/msrose/slack-name-battle) 
[![Greenkeeper badge](https://badges.greenkeeper.io/msrose/slack-name-battle.svg)](https://greenkeeper.io/)
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors)

Created using the AWS SAM CLI. See [SAM.md](./SAM.md) for more details.

## Setup

1. Create a [Slack app](https://api.slack.com/apps) that will serve to conduct the Name Battles.
1. Install the app in your workspace to obtain an OAuth Access Token (OAT); the app must have the `users:read` scope.
1. Make sure you have installed and configured the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html), and installed the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
1. Create an S3 Bucket for your deployment packages: e.g. `aws s3 mb --bucket-name name-battle-deployment`
1. Clone this repo and run the deploy script: `TOKEN=<OAT> bash deploy.sh`. It creates a CloudFormation stack called `name-battle` and assumes your deployment packages are in an S3 Bucket called `name-battle-deployment`, so change the script if your bucket is named differently.
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
<table><tr><td align="center"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4" width="100px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/msrose/slack-name-battle/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/msrose/slack-name-battle/commits?author=msrose" title="Documentation">📖</a> <a href="#infra-msrose" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td><td align="center"><a href="https://github.com/apps/greenkeeper"><img src="https://avatars3.githubusercontent.com/in/505?v=4" width="100px;" alt="greenkeeper[bot]"/><br /><sub><b>greenkeeper[bot]</b></sub></a><br /><a href="#infra-greenkeeper[bot]" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
