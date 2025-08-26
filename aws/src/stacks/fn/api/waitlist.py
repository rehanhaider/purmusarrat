"""Waitlist Lambda Function.

Raises:
    e: _description_

Returns:
    _type_: _description_

"""

# ==================================================================================================
# Python imports
import base64
import hashlib
import json
import os
import uuid

# ==================================================================================================
# Boto3 imports
import boto3
import requests
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# ==================================================================================================
# Global initializations
tracer = Tracer()
logger = Logger()

# ==================================================================================================
# Global declarations
CAPATCHA_CUTOFF_SCORE = 0.5

DOMAIN_NAME = os.environ["DOMAIN_NAME"]
EMAIL_IDENTITY_ARN = os.environ["EMAIL_IDENTITY_ARN"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])
ses = boto3.client("sesv2")

SITE_VERIFICATION_URL = "https://www.google.com/recaptcha/api/siteverify"


def get_confirmation_hash(email: str) -> str:
    """Create a confirmation hash for the email.

    Args:
        email (str): The email to create a hash for

    Returns:
        str: The confirmation hash
    """
    hash_key = hashlib.scrypt(email.encode(), salt=uuid.uuid4().bytes, n=16384, r=8, p=1, dklen=128).hex()
    return base64.b64encode(hash_key.encode()).decode()


def get_recaptcha_secret() -> str:
    """
    Get the reCaptcha secret from the environment
    """
    response = table.get_item(Key={"pk": "APP#DATA", "sk": "SECRETS"})
    return response.get("Item").get("RECAPATCHA_SECRET_KEY")


def verify_recaptcha(recaptcha_token: str) -> bool:
    """
    Verify the reCaptcha token
    """
    response = requests.post(
        SITE_VERIFICATION_URL,
        data={"secret": get_recaptcha_secret(), "response": recaptcha_token},
        timeout=30,
    )
    logger.info(f"Recaptcha response: {response.json()}")
    # Return true if the token is valid or the score is greater than 0.5
    return response.json().get("success") or response.json().get("score") > CAPATCHA_CUTOFF_SCORE


def send_email(email: str, hash_key: str) -> None:
    """
    Send an email to the user via SES
    """
    ses.send_email(
        FromEmailAddress=f"bootcamp@{DOMAIN_NAME}",
        FromEmailAddressIdentityArn=EMAIL_IDENTITY_ARN,
        Destination={
            "ToAddresses": [email],
        },
        Content={
            "Simple": {
                "Subject": {
                    "Data": "Welcome to the Cloud Developer Bootcamp!",
                    "Charset": "utf-8",
                },
                "Body": {
                    "Html": {
                        "Data": f"""<p>Welcome to the Cloud Developer Bootcamp! Click here to confirm your email:&nbsp;
                        <a href="https://{DOMAIN_NAME}/confirm?email={email}&hash={hash_key}">Confirm Email</a></p>""",
                        "Charset": "utf-8",
                    },
                },
            },
        },
    )


def add_to_waitlist(email: str) -> dict:
    """
    Add an email to the waitlist
    """
    if not email:
        return {
            "isBase64Encoded": False,
            "statusCode": 400,
            "body": json.dumps({"error": "Email is required"}),
        }

    # Check if the email is already in the waitlist
    # Let them register twice.

    # Store in DynamoDB
    item = {
        "pk": "WAITLIST#BOOTCAMP#2025",
        "sk": email,
        "email": email,
        "confirmed": False,
        "hash": get_confirmation_hash(email),
    }

    try:
        # Only update if the item doesn't exist or if confirmed is False
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(confirmed) OR confirmed = :false",
            ExpressionAttributeValues={":false": False},
        )
    except ClientError as e:
        logger.error(e)
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            # Item exists and is already confirmed
            return {
                "isBase64Encoded": False,
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Email already confirmed"}),
            }
        raise e

    # Send email to the user
    send_email(email, item["hash"])

    # The below format is required otherwise it throws a malformed proxy response error on AWS access logs.
    # TODO @rehan: Article / Video on this.

    return {
        "isBase64Encoded": False,
        # "multiValueHeaders": {"Access-Control-Allow-Origin": ["*"]} # TODO @rehan: Remove this. Currently here for reference.
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"message": "Successfully joined waitlist"}),
    }


def confirm_email(email: str, hash_key: str) -> dict:
    """
    Confirm an email address
    """
    # Check if the email is in the waitlist
    response = table.get_item(Key={"pk": "WAITLIST#BOOTCAMP#2025", "sk": email})
    item = response.get("Item")

    if not item:
        return {
            "isBase64Encoded": False,
            "statusCode": 404,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"message": "Email not found in waitlist"}),
        }

    # Check if hash matches and confirmed is false
    if item["hash"] == hash_key and item["confirmed"] is False:
        # Update the item to set confirmed to true and remove the hash
        try:
            table.update_item(
                Key={"pk": "WAITLIST#BOOTCAMP#2025", "sk": email},
                UpdateExpression="SET confirmed = :true REMOVE #hash",
                ConditionExpression="confirmed = :false AND #hash = :hash",
                ExpressionAttributeNames={"#hash": "hash"},
                ExpressionAttributeValues={
                    ":true": True,
                    ":false": False,
                    ":hash": hash_key,
                },
            )
            return {
                "isBase64Encoded": False,
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Successfully confirmed email"}),
            }
        except ClientError as e:
            logger.error(e)
            return {
                "isBase64Encoded": False,
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Failed to confirm email"}),
            }

    return {
        "isBase64Encoded": False,
        "statusCode": 400,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"message": "Invalid confirmation link"}),
    }


def handler(event: dict, context: LambdaContext) -> dict:
    """
    Lambda handler
    """
    logger.info(f"Event: {event}")
    logger.info(f"Context: {context}")

    if event["httpMethod"] == "POST":
        body = json.loads(event["body"])
        email = body.get("email")
        # Verify recaptcha token
        if not verify_recaptcha(body.get("recaptchaToken")):
            return {
                "isBase64Encoded": False,
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Recaptcha verification failed"}),
            }
        return add_to_waitlist(email)

    if event["httpMethod"] == "GET":
        # Extract email and hash from query parameters
        params = event.get("queryStringParameters", {}) or {}
        email = params.get("email")
        hash_key = params.get("hash")

        if not email or not hash_key:
            return {
                "isBase64Encoded": False,
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"message": "Email and hash are required"}),
            }

        return confirm_email(email, hash_key)

    return None
