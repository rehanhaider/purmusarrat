"""
# --*-- coding: utf-8 --*--
# This lambda function is responsible for posting tweets to twitter.
"""

import os
import boto3
import json

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from lib.upload import upload_media

tracer = Tracer()
logger = Logger()


QUEUE_NAME = os.environ["SQS_QUEUE_NAME"]


@tracer.capture_lambda_handler
def main(event: dict, context: LambdaContext) -> dict:
    logger.info("Event: %s", event)
    logger.info("Context: %s", context)

    logger.info("Queue Name: %s", QUEUE_NAME)

    queue = boto3.resource("sqs").get_queue_by_name(QueueName=QUEUE_NAME)

    # poll for messages
    messages = queue.receive_messages(MaxNumberOfMessages=1)
    if not messages:
        return {"message": "No messages in the queue"}

    message = json.loads(messages[0].body)

    logger.info("Message: %s", message)
    bucket = message["Records"][0]["s3"]["bucket"]["name"]
    media = message["Records"][0]["s3"]["object"]["key"]

    # download the media file and save it to /tmp
    s3 = boto3.client("s3")
    s3.download_file(bucket, media, f"/tmp/{media}")

    # upload the media file to Twitter
    try:
        upload_media(f"/tmp/{media}")
    except Exception as e:
        logger.exception(e)
        return {"message": "Error uploading media to Twitter"}

    messages[0].delete()

    # delete the media file from S3
    s3.delete_object(Bucket=bucket, Key=media)

    return {"message": "Tweets posted successfully!"}
