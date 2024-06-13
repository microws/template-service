import { Application, Environment, IApplication, IEnvironment } from "aws-cdk-lib/aws-appconfig";
import { ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

export function ImportedStack(
  scope: Construct & {
    account: string;
    region: string;
  },
  props: {
    vpcName?: string;
  },
): {
  bucket: IBucket;
  table: ITable;
  evidently: string;
  appConfig: {
    application: IApplication;
    environment: IEnvironment;
    configuration: string;
  };
} {
  const bucket = Bucket.fromBucketAttributes(scope, "MicrowsBucket", {
    bucketArn: cdk.Fn.importValue("[@TODO from stack exports]"),
    bucketDomainName: cdk.Fn.importValue("[@TODO from stack exports]"),
    bucketName: cdk.Fn.importValue("[@TODO from stack exports]"),
    account: scope.account,
    region: scope.region,
  });

  const table = Table.fromTableAttributes(scope, "MicrowsTable", {
    tableArn: cdk.Fn.importValue("[@TODO from stack exports]"),
  });

  const application = Application.fromApplicationId(
    scope,
    "MicrowsAppConfig",
    cdk.Fn.importValue("[@TODO from stack exports]"),
  );
  const environment = Environment.fromEnvironmentAttributes(scope, "MicrowsAppConfigEnvironment", {
    application: application,
    environmentId: cdk.Fn.importValue("[@TODO from stack exports]"),
  });

  return {
    bucket,
    table,
    evidently: cdk.Fn.importValue("[@TODO from stack exports]"),
    appConfig: {
      application,
      environment,
      configuration: `/applications/${application.applicationId}/environments/${environment.environmentId}/configurations/Microws`,
    },
  };
}
