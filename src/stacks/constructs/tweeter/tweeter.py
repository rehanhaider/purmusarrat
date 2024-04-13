"""
# --*-- coding: utf-8 --*--
# This lambda function is responsible for posting tweets to twitter.
"""

import os
import boto3

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

from lib.upload import upload_media

tracer = Tracer()
logger = Logger()


QUEUE_NAME = os.environ["SQS_QUEUE_ARN"].split(":")[-1]


@tracer.capture_lambda_handler
def main(event: dict, context: LambdaContext) -> dict:
    logger.info("Event: %s", event)
    logger.info("Context: %s", context)

    queue = boto3.resource("sqs").get_queue_by_name(QueueName=QUEUE_NAME)

    # poll for messages
    for message in queue.receive_messages():
        bucket = message.body["Records"][0]["s3"]["bucket"]["name"]
        media = message.body["Records"][0]["s3"]["object"]["key"]

        # download the media file and save it to /tmp
        s3 = boto3.client("s3")
        s3.download_file(bucket, media, f"/tmp/{media}")

        # upload the media file to Twitter
        try:
            upload_media(f"/tmp/{media}")
        except Exception as e:
            logger.exception(e)
            return {"message": "Error uploading media to Twitter"}

        message.delete()

    return {"message": "Tweets posted successfully!"}
