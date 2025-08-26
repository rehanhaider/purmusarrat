import { Stack, StackProps } from "aws-cdk-lib";
import {
    aws_apigateway as apigateway,
    aws_lambda as lambda,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_cognito as cognito,
    aws_ssm as ssm,
    aws_certificatemanager as acm,
    aws_ses as ses,
    RemovalPolicy,
    Size,
    Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConstantsType, ParamsType } from "../constants";
import { join } from "path";

export interface ApiStackProps extends StackProps {
    constants: ConstantsType;
    params: ParamsType;
}

export interface ApiStackProps extends StackProps {
    constants: ConstantsType;
    params: ParamsType;
}

export class ApiStack extends Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // SSM parameters
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const tableName = ssm.StringParameter.fromStringParameterAttributes(this, `${props.constants.APP_NAME}-TableName`, {
            parameterName: props.params.TABLE_NAME,
        });

        const commonLayerArn = ssm.StringParameter.fromStringParameterAttributes(this, `${props.constants.APP_NAME}-CommonLayerArn`, {
            parameterName: props.params.COMMON_LAYER_ARN,
        });

        const userPoolArn = ssm.StringParameter.fromStringParameterAttributes(this, `${props.constants.APP_NAME}-UserPoolArn`, {
            parameterName: props.params.USER_POOL_ARN,
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Cognito User Pool
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const userPool = cognito.UserPool.fromUserPoolArn(this, `${props.constants.APP_NAME}-UserPool`, userPoolArn.stringValue);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // DynamoDB table
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const table = dynamodb.Table.fromTableAttributes(this, `${props.constants.APP_NAME}-Table`, {
            tableName: tableName.stringValue,
            localIndexes: ["byItemHash"],
            grantIndexPermissions: true,
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Email Identity
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const emailIdentity = ses.EmailIdentity.fromEmailIdentityName(
            this,
            `${props.constants.APP_NAME}-EmailIdentity`,
            `${props.constants.DOMAIN_NAME}`,
        );

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Lambda handler
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const commonLayer = lambda.LayerVersion.fromLayerVersionArn(
            this,
            `${props.constants.APP_NAME}-CommonLayer`,
            commonLayerArn.stringValue,
        );

        const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
            this,
            `${props.constants.APP_NAME}-PowertoolsLayer`,
            props.constants.ARN_POWERTOOLS_LAYER,
        );

        const apiFn = new lambda.Function(this, `${props.constants.APP_NAME}-ApiHandler`, {
            functionName: `${props.constants.APP_NAME}-ApiHandler`,
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: "app.main",
            code: lambda.Code.fromAsset(join(__dirname, "fn/api")),
            layers: [commonLayer, powertoolsLayer],
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        table.grantReadWriteData(apiFn);

        new logs.LogGroup(this, `${props.constants.APP_NAME}-ApiHandlerLogGroup`, {
            logGroupName: `/aws/lambda/${apiFn.functionName}`,
            removalPolicy: RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.TWO_WEEKS,
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // API Gateway
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Authorizer for the API Gateway
        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, `${props.constants.APP_NAME}-Authorizer`, {
            authorizerName: `${props.constants.APP_NAME}-Authorizer`,
            cognitoUserPools: [userPool],
        });

        // Base API Gateway. @TODO Evaluate if this can be configured at API GW V2
        const apiGateway = new apigateway.RestApi(this, `${props.constants.APP_NAME}-Api`, {
            restApiName: `${props.constants.APP_NAME}-Api`,
            deployOptions: {
                stageName: "v1",
            },
            endpointTypes: [apigateway.EndpointType.REGIONAL],
            minCompressionSize: Size.bytes(0),

            defaultCorsPreflightOptions: {
                allowOrigins: ["*"],
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["*", "Authorization"],
            },
        });

        // Proxy Authenticated API
        const proxyApi = apiGateway.root.addProxy({
            defaultIntegration: new apigateway.LambdaIntegration(apiFn),
            defaultMethodOptions: {
                authorizationType: apigateway.AuthorizationType.COGNITO,
                authorizer: authorizer,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: ["*"],
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["*", "Authorization"],
            },
        });

        //////////////////////////////////////////
        // API Definitions for Waitlist
        //////////////////////////////////////////

        // Waitlist Lambda
        const waitlistLambda = new lambda.Function(this, `${props.constants.APP_NAME}-WaitlistLambda`, {
            code: lambda.Code.fromAsset(join(__dirname, "fn/api")),
            handler: "waitlist.handler",
            runtime: lambda.Runtime.PYTHON_3_12,
            environment: {
                TABLE_NAME: tableName.stringValue,
                DOMAIN_NAME: props.constants.DOMAIN_NAME,
                EMAIL_IDENTITY_ARN: emailIdentity.emailIdentityArn,
            },
            layers: [commonLayer, powertoolsLayer],
        });

        // Grant permissions to the Waitlist Lambda
        table.grantReadWriteData(waitlistLambda);
        emailIdentity.grantSendEmail(waitlistLambda);
        // Waitlist Resource
        const waitlistResource = apiGateway.root.addResource("waitlist");

        waitlistResource.addMethod("POST", new apigateway.LambdaIntegration(waitlistLambda), {
            authorizationType: apigateway.AuthorizationType.NONE,
            methodResponses: [
                {
                    statusCode: "200",
                },
            ],
        });

        waitlistResource.addMethod("GET", new apigateway.LambdaIntegration(waitlistLambda), {
            authorizationType: apigateway.AuthorizationType.NONE,
            methodResponses: [
                {
                    statusCode: "200",
                },
            ],
        });
    }
}
