import * as cdk from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

interface ServiceStackProps extends cdk.StackProps {}
export class ServiceStack extends cdk.Stack {
  public readonly repository: Repository;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.repository = new Repository(this, "Docker", {});
  }
}
