set -e

DOCKER_NETWORK=slack-name-battle
DYNAMODB_CONTAINER=dynamodb
ENV_VAR_FILE=env.json

stop_dynamodb() {
  echo
  echo "Stopping dynamodb..."
  docker container stop $DYNAMODB_CONTAINER
  echo "Done."
}

rm -rf .aws-sam/build

[[ ! -f $ENV_VAR_FILE ]] && cp env.example.json $ENV_VAR_FILE

docker network inspect $DOCKER_NETWORK || docker network create $DOCKER_NETWORK

docker container inspect dynamodb || docker run -d -p 8000:8000 --network $DOCKER_NETWORK --name dynamodb amazon/dynamodb-local
docker container start dynamodb

trap "stop_dynamodb" SIGINT

aws dynamodb create-table \
  --table-name NameBattle \
  --key-schema AttributeName=slack_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --attribute-definitions AttributeName=slack_id,AttributeType="S" AttributeName=timestamp,AttributeType="N" \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --endpoint-url http://localhost:8000

aws dynamodb update-time-to-live \
  --table-name NameBattle \
  --time-to-live-specification "Enabled=true,AttributeName=timestamp" \
  --endpoint-url http://localhost:8000

sam local start-api --env-vars $ENV_VAR_FILE --docker-network $DOCKER_NETWORK
