set -e

sam build
sam package --output-template-file packaged.yaml --s3-bucket name-battle-deployment
aws cloudformation deploy \
  --parameter-overrides "SlackTokenParameter=$TOKEN" \
  --template-file packaged.yaml \
  --stack-name name-battle \
  --capabilities CAPABILITY_IAM
