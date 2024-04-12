import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_sqs as sqs, aws_s3 as s3, Duration } from "aws-cdk-lib";
import { aws_s3_notifications as s3_notifications } from "aws-cdk-lib";

export interface DataStackProps extends StackProps {
    MEDIA_BUCKET: string;
}


export class DataStack extends Stack {
    public readonly queueArn: string;
    constructor(scope: Construct, id: string, props: DataStackProps) {
        super(scope, id, props);

        const queue = new sqs.Queue(this, 'Queue', {
            visibilityTimeout: Duration.seconds(300),
        });

        this.queueArn = queue.queueArn;

        const bucket = s3.Bucket.fromBucketName(this, 'MediaBucket', props.MEDIA_BUCKET);
        bucket.addObjectCreatedNotification(new s3_notifications.SqsDestination(queue));
    }
}