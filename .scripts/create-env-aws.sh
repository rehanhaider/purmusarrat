#!/bin/bash

ACCOUNT_ID=$(aws sts get-caller-identity --query ["Account"] --output text)
REGION=$(aws configure get region)

if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: Failed to get AWS account ID"
    exit 1
fi

if [ -z "$REGION" ]; then
    echo "Error: Failed to get AWS region"
    exit 1
fi



# Get the project name from config.json file and remove all spaces
PROJECT_NAME=$(cat config.json | jq -r '.PROJECT_NAME' | tr -d ' ')
PROJECT_NAME=$(echo "SnapNews" | tr -d ' ')

# Compute the MD5 hash of the project name
BUCKET_NAME=$(echo -n $PROJECT_NAME | md5sum | cut -d ' ' -f 1)


# Get the AWS Cognito User Pool ID
userPoolId=$(aws cognito-idp list-user-pools --max-results 50 --query "UserPools[?Name=='${PROJECT_NAME}Pool'].Id" --output text)

# Get the AWS Cognito User Pool Client ID
appClientId=$(aws cognito-idp list-user-pool-clients --user-pool-id "$userPoolId" --query "UserPoolClients[*].[ClientId]" --output text)

# Get the API gateway execution URL
apiGwId=$(aws apigateway get-rest-apis --query items[0].id --output text)



echo "PROJECT_NAME=$PROJECT_NAME" 
echo "BUCKET_NAME=$BUCKET_NAME"
echo "USER_POOL_ID=$userPoolId"
echo "APP_CLIENT_ID=$appClientId"

echo "SECRET_AWS_ACCOUNT=$ACCOUNT_ID" > .env.aws.local
echo "PUBLIC_AWS_REGION=$REGION" >> .env.aws.local
echo "PUBLIC_USER_POOL_ID=$userPoolId" >> .env.aws.local
echo "PUBLIC_APP_CLIENT_ID=$appClientId" >> .env.aws.local
echo "PUBLIC_BUCKET_NAME=$BUCKET_NAME" >> .env.aws.local
echo "PUBLIC_API_GW_URL=https://$apiGwId.execute-api.$REGION.amazonaws.com/v1" >> .env.aws.local