import { Construct } from "constructs";
import { StackProps, Duration, RemovalPolicy } from "aws-cdk-lib";
import { aws_lambda as lambda, aws_logs as logs } from "aws-cdk-lib";
import { join } from "path";

export interface TweeterProps extends StackProps {
    SQS_QUEUE_ARN: string;
}

export class Tweeter extends Construct {
    public readonly Fn: lambda.Function;
    constructor(scope: Construct, id: string, props: TweeterProps) {
        super(scope, id);

        const LayerPython = new lambda.LayerVersion(this, 'PurmusarratLayer', {
            code: lambda.Code.fromAsset(join(process.cwd(), 'layer_python')),
            removalPolicy: RemovalPolicy.DESTROY,
        });

        this.Fn = new lambda.Function(this, 'TweeterFunction', {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'tweeter.main',
            code: lambda.Code.fromAsset(join(__dirname, 'tweeter')),
            layers: [LayerPython],
            environment: {
                TWEET: props.SQS_QUEUE_ARN,
            },
            timeout: Duration.seconds(120),
            logRetention: logs.RetentionDays.ONE_DAY,
        });

        new logs.LogGroup(this, 'TweeterLogGroup', {
            logGroupName: `/aws/lambda/${this.Fn.functionName}`,
            removalPolicy: RemovalPolicy.DESTROY,
        });

    }
}