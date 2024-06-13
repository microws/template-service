import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CreateParameterStore, MicrowsService, MicrowsDynamoDBTable, MicrowsLambdaLayer } from "@microws/cdk";
import { ContainerImage, LogDrivers } from "aws-cdk-lib/aws-ecs";
import { ListenerCondition } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { EventBus } from "aws-cdk-lib/aws-events";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { ImportedStack } from "./importedMicrows.js";

interface ControllerStackProps extends cdk.StackProps {
  stage: "prod" | "dev";
  name: string;
  dockerBuildSha256: string;
  vpcName: string;
  repository: Repository;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ControllerStackProps) {
    super(scope, id, props);
    const { addParameter, ecsSecrets, attachSecureParameter, environmentVariables } = CreateParameterStore(
      this,
      `/${props.name}/${props.stage}/`,
    );
    const microwsStack = ImportedStack(this, {});

    addParameter("APP_CONFIG", microwsStack.appConfig.configuration);
    const amazonEventBus = EventBus.fromEventBusName(this, "AWSEventBus", "default");
    const microwsEventBus = EventBus.fromEventBusName(this, "MicrowsBus", `${props.vpcName}-${props.stage}-MicrowsBus`);

    const mainTable = MicrowsDynamoDBTable(this, "Main", {
      autoIndexes: 5,
      gsiIndexes: 3,
      headerIndex: true,
      projIndexes: 2,
      eventBus: microwsEventBus,
      environment: {
        stage: props.stage,
        domain: "Products",
        service: "Catalog",
      },
    });
    addParameter("MAIN_TABLE", mainTable.tableName);

    const baseLayer = MicrowsLambdaLayer(this, "BaseLayer", {
      entry: "baseLayer.ts",
    });
    const imageLayer = MicrowsLambdaLayer(this, "ImageLayer", {
      entry: "imageLayer.ts",
    });

    const { fargateTaskDefinition } = MicrowsService(this, {
      name: "Base",
      env: props.stage,
      image: ContainerImage.fromEcrRepository(props.repository, props.dockerBuildSha256),
      priority: 100,
      vpcName: props.vpcName,
      patterns: [
        ListenerCondition.hostHeaders(
          props.stage == "prod"
            ? ["www.microws.com", "microws.com", "microws.io"]
            : ["www.microws-dev.me", "microws-dev.me", "dev.microws.io"],
        ),
        ListenerCondition.pathPatterns(["/api/catalog/*"]),
      ],
      environmentVariables: {
        ...environmentVariables("ecs", ["MAIN_TABLE", "APP_CONFIG"]),
        NODE_ENV: props.stage,
      },
    });
    mainTable.grantReadWriteData(fargateTaskDefinition.taskRole);

    fargateTaskDefinition.addContainer("AppConfigAgent", {
      image: ContainerImage.fromRegistry("public.ecr.aws/aws-appconfig/aws-appconfig-agent:2.x"),
      logging: LogDrivers.awsLogs({
        streamPrefix: "website",
        logRetention: RetentionDays.ONE_MONTH,
      }),
      portMappings: [
        {
          containerPort: 2772,
        },
      ],
      environment: {
        POLL_INTERVAL: "10",
        EVIDENTLY_CONFIGURATIONS: microwsStack.appConfig.configuration,
        PREFETCH_LIST: microwsStack.appConfig.configuration,
      },
    });
    microwsStack.appConfig.environment.grantReadConfig(fargateTaskDefinition.taskRole);
    fargateTaskDefinition.taskRole.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ["evidently:PutProjectEvents"],
        effect: Effect.ALLOW,
        resources: [microwsStack.evidently],
      }),
    );
  }
}
