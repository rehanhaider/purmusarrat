import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_sqs as sqs, aws_s3 as s3, Duration } from "aws-cdk-lib";
import { aws_s3_notifications as s3_notifications } from "aws-cdk-lib";

export class DataStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const queue = new sqs.Queue(this, 'Queue', {
            visibilityTimeout: Duration.seconds(300),
        });

        const bucket = s3.Bucket.fromBucketName(this, 'Bucket', 'purmusarrat');
        bucket.addObjectCreatedNotification(new s3_notifications.SqsDestination(queue));
    }
}