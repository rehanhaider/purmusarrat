import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_events as events, aws_events_targets as targets, Duration } from "aws-cdk-lib";


export class SchedulerStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.expression('rate(1 hour)'),
        });
    }
}