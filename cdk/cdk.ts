#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "./stack.js";

import { ServiceStack } from "./service.js";
const app = new cdk.App();

const vpcName = "EnvironmentSetup";

const serviceStack = new ServiceStack(app, process.env.npm_package_config_service, {
  env: {
    account: process.env.npm_package_config_awsAccount,
    region: process.env.npm_package_config_awsRegion,
  },
});

new CdkStack(app, process.env.npm_package_config_service + "Dev", {
  crossRegionReferences: true,
  env: {
    account: process.env.npm_package_config_awsAccount,
    region: process.env.npm_package_config_awsRegion,
  },
  stage: "dev",
  repository: serviceStack.repository,
  name: process.env.npm_package_config_service,
  dockerBuildSha256: null, //[@TODO add once npm run publishDocker has been done],
  vpcName,
});
new CdkStack(app, process.env.npm_package_config_service + "Prod", {
  crossRegionReferences: true,
  env: {
    account: process.env.npm_package_config_awsAccount,
    region: process.env.npm_package_config_awsRegion,
  },
  stage: "prod",
  repository: serviceStack.repository,
  name: process.env.npm_package_config_service,
  dockerBuildSha256: null, //[@TODO add once npm run publishDocker has been done],
  vpcName,
});
