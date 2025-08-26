import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { aws_cognito as cognito, aws_certificatemanager as acm, aws_ssm as ssm } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConstantsType, ParamsType } from "../constants";

export interface AuthStackProps extends StackProps {
    constants: ConstantsType;
    params: ParamsType;
}

export class AuthStack extends Stack {
    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);

        const FROM_EMAIL = `noreply@${props.constants.DOMAIN_NAME}`;
        const FROM_NAME = props.constants.BRAND_NAME;
        const REPLY_TO = `support@${props.constants.DOMAIN_NAME}`;
        const EMAIL_SUBJECT = `[${props.constants.PROJECT_NAME}] Please verify your email address`;
        const MESSAGE_STRING = `Hi,<br><br>
        To complete your signup please verify your email by clicking on {##Verify Email##}<br><br>
        Best Regards,<br>
        ${props.constants.PROJECT_NAME} Team`;

        ////////////////////////////////////////////////////////////
        // Cognito User Pool
        ////////////////////////////////////////////////////////////
        const userPool = new cognito.UserPool(this, `${props.constants.APP_NAME}-UserPool`, {
            userPoolName: `${props.constants.APP_NAME}-UserPool`,
            signInAliases: { email: true },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false,
                },
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
            },
            mfa: cognito.Mfa.OFF,
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            email: cognito.UserPoolEmail.withSES({
                fromEmail: FROM_EMAIL,
                fromName: FROM_NAME,
                replyTo: REPLY_TO,
                sesVerifiedDomain: props.constants.DOMAIN_NAME,
            }),
            // email: cognito.UserPoolEmail.withCognito(),
            userVerification: {
                emailSubject: EMAIL_SUBJECT,
                emailBody: MESSAGE_STRING,
                emailStyle: cognito.VerificationEmailStyle.LINK,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        ////////////////////////////////////////////////////////////
        // Create SSM parameters
        ////////////////////////////////////////////////////////////

        const userPoolArnParameter = new ssm.StringParameter(this, `${props.constants.APP_NAME}-UserPoolArn`, {
            parameterName: props.params.USER_POOL_ARN,
            stringValue: userPool.userPoolArn,
            tier: ssm.ParameterTier.STANDARD,
            description: `The ARN of the Cognito User Pool for ${props.constants.APP_NAME}`,
        });

        ////////////////////////////////////////////////////////////
        // Cognito User Pool Client
        ////////////////////////////////////////////////////////////

        const userPoolClient = new cognito.UserPoolClient(this, `${props.constants.APP_NAME}-UserPoolClient`, {
            userPool: userPool,
            userPoolClientName: `${props.constants.APP_NAME}-UserPoolClient`,
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true,
            },
            generateSecret: false,
            oAuth: {
                callbackUrls: [
                    "http://localhost:3000/",
                    `https://${props.constants.DOMAIN_NAME}`,
                    `https://www.${props.constants.DOMAIN_NAME}`,
                ],
            },
        });
    }
}
