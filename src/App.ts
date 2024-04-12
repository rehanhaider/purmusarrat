import { App, Tags } from 'aws-cdk-lib';
import { SchedulerStack } from './lib/SchedulerStack';
import { DataStack } from './lib/DataStack';

const app = new App();
const scheduler = new SchedulerStack(app, 'PM-Scheduler');
const data = new DataStack(app, 'PM-Data');

Tags.of(scheduler).add('app', 'purmusarrat')
Tags.of(data).add('app', 'purmusarrat')

app.synth();