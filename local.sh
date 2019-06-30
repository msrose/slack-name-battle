set -e

docker container stop dynamodb
docker container rm dynamodb

docker network rm slack-name-battle
docker network create slack-name-battle

docker run -d -p 8000:8000 --network slack-name-battle --name dynamodb amazon/dynamodb-local

aws dynamodb create-table \
  --table-name NameBattle \
  --key-schema AttributeName=slack_id,KeyType=HASH AttributeName=timestamp,KeyType=ORDER \
  --attribute-definitions AttributeName=slack_id,AttributeType="S" AttributeName=timestamp,AttributeType="N" \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --endpoint-url http://localhost:8000

aws dynamodb update-time-to-live \
  --table-name NameBattle \
  --time-to-live-specification "Enabled=true, AttributeName=timestamp" \
  --endpoint-url http://localhost:8000

sam local start-api --env-vars env.json --docker-network slack-name-battle
