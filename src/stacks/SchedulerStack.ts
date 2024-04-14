import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_events as events, aws_events_targets as targets, aws_s3 as s3, aws_sqs as sqs, Duration } from "aws-cdk-lib";

import { Tweeter } from "./constructs/Tweeter";

export interface SchedulerStackProps extends StackProps {
    SCHEDULE_HOURS: number;
    SQS_QUEUE_ARN: string;
    MEDIA_BUCKET: string;
}

export class SchedulerStack extends Stack {
    constructor(scope: Construct, id: string, props: SchedulerStackProps) {
        super(scope, id, props);

        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(Duration.hours(props.SCHEDULE_HOURS)),
        });

        const queue = sqs.Queue.fromQueueArn(this, 'Queue', props.SQS_QUEUE_ARN);

        const tweeter = new Tweeter(this, 'Tweeter', { SQS_QUEUE_NAME: queue.queueName });

        rule.addTarget(new targets.LambdaFunction(tweeter.Fn));

        const bucket = s3.Bucket.fromBucketName(this, 'MediaBucket', props.MEDIA_BUCKET);

        bucket.grantReadWrite(tweeter.Fn);
        queue.grantConsumeMessages(tweeter.Fn);

    }
}