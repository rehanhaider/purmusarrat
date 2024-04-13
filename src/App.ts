import { App, Tags } from "aws-cdk-lib";
import { SchedulerStack } from "./stacks/SchedulerStack";
import { DataStack } from "./stacks/DataStack";

import { getJsonData } from "./common/utils";

const AppDefaults = getJsonData("src/AppDefaults.json");

const app = new App();

const data = new DataStack(app, "PM-Data", {
  MEDIA_BUCKET: AppDefaults.MEDIA_BUCKET,
});

const scheduler = new SchedulerStack(app, "PM-Scheduler", {
  SCHEDULE_HOURS: AppDefaults.SCHEDULE_HOURS,
  SQS_QUEUE_ARN: data.queueArn,
  MEDIA_BUCKET: AppDefaults.MEDIA_BUCKET,
});

Tags.of(data).add("app", "purmusarrat");
Tags.of(scheduler).add("app", "purmusarrat");

app.synth();
