import { Stack, StackProps } from "aws-cdk-lib";
import {
    aws_dynamodb as dynamodb,
    aws_lambda as lambda,
    aws_ssm as ssm,
    RemovalPolicy,
    aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";
import { ConstantsType, ParamsType } from "../constants";

export interface CommonStackProps extends StackProps {
    constants: ConstantsType;
    params: ParamsType;
}

export class CommonStack extends Stack {
    constructor(scope: Construct, id: string, props: CommonStackProps) {
        super(scope, id, props);

        ////////////////////////////////////////////////////////////
        // DynamoDB table for holding News data
        ////////////////////////////////////////////////////////////
        // Create a DynamoDB table for the API
        const table = new dynamodb.Table(this, `${props.constants.APP_NAME}-Table`, {
            tableName: `${props.constants.APP_NAME}-Table`,
            partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: "ttl",
            removalPolicy: RemovalPolicy.DESTROY,
        });

        ////////////////////////////////////////////////////////////
        // Common Layer for lambda functions
        ////////////////////////////////////////////////////////////

        const commonLayer = new lambda.LayerVersion(this, `${props.constants.APP_NAME}-CommonLayer`, {
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
            code: lambda.Code.fromAsset(join(__dirname, "../../.layers/common")),
            removalPolicy: RemovalPolicy.RETAIN,
        });

        ////////////////////////////////////////////////////////////
        // Create SSM parameters
        ////////////////////////////////////////////////////////////

        const tableNameParameter = new ssm.StringParameter(this, `${props.constants.APP_NAME}-TableName`, {
            parameterName: props.params.TABLE_NAME,
            stringValue: table.tableName,
            tier: ssm.ParameterTier.STANDARD,
            description: `The name of the DynamoDB table for ${props.constants.APP_NAME}`,
        });

        const commonLayerArnParameter = new ssm.StringParameter(this, `${props.constants.APP_NAME}-CommonLayerArn`, {
            parameterName: props.params.COMMON_LAYER_ARN,
            stringValue: commonLayer.layerVersionArn,
            tier: ssm.ParameterTier.STANDARD,
            description: `The ARN of the Common Layer for ${props.constants.APP_NAME}`,
        });
    }
}
