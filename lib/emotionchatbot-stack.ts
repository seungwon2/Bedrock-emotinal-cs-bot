import { Duration, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class EmotionchatbotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //lambda
    const getdbLambda = new lambda.Function(this, "getdb", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/getdb.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_9,
    });
    const layer = new lambda.LayerVersion(this, "boto3Layer", {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9], // Lambda 함수와 호환되는 런타임 지정
      code: lambda.Code.fromAsset("lambda/python.zip"), // boto3 패키지가 있는 로컬 경로
      description: "Lambda Layer with boto3", // 설명 (선택 사항)
    });

    const bedrockLambda = new lambda.Function(this, "bedrock", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/bedrock.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_9,
      layers: [layer],
    });
    const snsLambda = new lambda.Function(this, "sns", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/sns.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    //service execution role
    getdbLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: ["*"],
      })
    );

    bedrockLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      })
    );

    snsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      })
    );

    //task generation
    const getdb = new tasks.LambdaInvoke(this, "getdbLambda", {
      lambdaFunction: getdbLambda,
      outputPath: "$.Payload",
    });
    const bedrock = new tasks.LambdaInvoke(this, "bedrockLambda", {
      lambdaFunction: bedrockLambda,
      outputPath: "$.Payload",
    });
    const sns = new tasks.LambdaInvoke(this, "snsLambda", {
      lambdaFunction: snsLambda,
      outputPath: "$.Payload",
    });

    //chain
    const choice = new sfn.Choice(this, "Is emotion Negative?");
    const successState = new sfn.Pass(this, "SuccessState");
    choice.when(sfn.Condition.stringEquals("$.emotion", "NEGATIVE"), sns);
    choice.otherwise(successState);
    bedrock.next(choice);
    const definition = getdb.next(bedrock);

    //statemachine
    const stateMachine = new sfn.StateMachine(this, "stateMachine", {
      definition,
      timeout: cdk.Duration.minutes(15),
      stateMachineType: sfn.StateMachineType.EXPRESS,
    });

    //lambda role
    getdbLambda.grantInvoke(stateMachine.role);
    bedrockLambda.grantInvoke(stateMachine.role);
    snsLambda.grantInvoke(stateMachine.role);

    const restApi = new apigateway.RestApi(this, "API Endpoint", {
      deployOptions: {
        stageName: "prod",
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      restApiName: `StepFunctionAPI`,
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // 또는 도메인을 제한하려면 실제 도메인 값 사용
        allowMethods: apigateway.Cors.ALL_METHODS, // 또는 필요한 HTTP 메서드 목록 사용
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });
    restApi.root.addMethod(
      "POST",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine)
    );

    new CfnOutput(this, "STATEMACHINE", {
      value: stateMachine.stateMachineArn,
    });
  }
}
