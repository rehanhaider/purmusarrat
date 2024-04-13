"""
# --*-- coding: utf-8 --*--
# This lambda function is responsible for posting tweets to twitter.
"""

import os
import boto3

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()

QUEUE_NAME = os.environ["SQS_QUEUE_ARN"].split(":")[-1]


@tracer.capture_lambda_handler
def main(event: dict, context: LambdaContext) -> dict:
    logger.info("Event: %s", event)
    logger.info("Context: %s", context)

    queue = boto3.resource("sqs").get_queue_by_name(QueueName=QUEUE_NAME)

    message = {
        "Records": [
            {
                "eventVersion": "2.1",
                "eventSource": "aws:s3",
                "awsRegion": "us-east-1",
                "eventTime": "2024-04-13T05:27:51.218Z",
                "eventName": "ObjectCreated:Put",
                "userIdentity": {"principalId": "AWS:AIDAT5DR4A7F2PR2XPFZR"},
                "requestParameters": {"sourceIPAddress": "45.251.234.164"},
                "responseElements": {
                    "x-amz-request-id": "25EBYGMFP7164CJZ",
                    "x-amz-id-2": "dA8MwPDR38te8AA4KPOfLl3dIYU4rtvQh+crfLosndDXxm98E2qcWzTJeb6j4nF8xuMEj72lC6F42F6DlIy7r3L2dA1VYRJ0",
                },
                "s3": {
                    "s3SchemaVersion": "1.0",
                    "configurationId": "arn:aws:cloudformation:us-east-1:268674271179:stack/PM-Data/10985c00-f8df-11ee-9768-0e487f2d5199-3305077155347254456",
                    "bucket": {
                        "name": "purmusarrat",
                        "ownerIdentity": {"principalId": "A1WRI4LHW2DN5L"},
                        "arn": "arn:aws:s3:::purmusarrat",
                    },
                    "object": {
                        "key": "Optimise-VHD.ps1",
                        "size": 1543,
                        "eTag": "5537037e5d895b01f869c33d93744470",
                        "sequencer": "00661A17D72EB1CF89",
                    },
                },
            }
        ]
    }

    # poll for messages
    for message in queue.receive_messages():
        bucket = message.body["Records"][0]["s3"]["bucket"]["name"]
        media = message.body["Records"][0]["s3"]["object"]["key"]

        # download the media file and save it to /tmp
        s3 = boto3.client("s3")
        s3.download_file(bucket, media, f"/tmp/{media}")

        message.delete()

    return {"message": "Tweets posted successfully!"}
