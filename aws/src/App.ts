import { App } from "aws-cdk-lib";
import { CommonStack } from "./stacks/Common";

import { PARAMS, CONSTANTS } from "./constants";

const app = new App();

const APP_NAME = CONSTANTS.APP_NAME;

new CommonStack(app, `${APP_NAME}-CommonStack`, {
    constants: CONSTANTS,
    params: PARAMS,
});

app.synth();
