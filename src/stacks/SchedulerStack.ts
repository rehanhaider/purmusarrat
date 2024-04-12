import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_events as events, aws_events_targets as targets, Duration } from "aws-cdk-lib";

export interface SchedulerStackProps extends StackProps {
    SCHEDULE_HOURS: number;
    QUEUE_ARN: string;
}

export class SchedulerStack extends Stack {
    constructor(scope: Construct, id: string, props: SchedulerStackProps) {
        super(scope, id, props);

        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(Duration.hours(props.SCHEDULE_HOURS)),
        });

        console.log(props.QUEUE_ARN);
    }
}