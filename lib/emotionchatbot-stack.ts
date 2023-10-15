import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from "aws-cdk-lib/aws-iam";
import { HttpMethods } from "aws-cdk-lib/aws-s3";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export class EmotionchatbotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //lambda
    const emotionLambda = new lambda.Function(this, "emotion", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/emotion.py", { encoding: "utf-8" })
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
    emotionLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["comprehend:*"],
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
    const emotion = new tasks.LambdaInvoke(this, "emotionLambda", {
      lambdaFunction: emotionLambda,
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
    choice.when(
      sfn.Condition.stringEquals("$.emotion", "POSITIVE"),
      successState
    );
    choice.when(
      sfn.Condition.stringEquals("$.emotion", "NEUTRAL"),
      successState
    );
    choice.when(sfn.Condition.stringEquals("$.emotion", "MIXED"), successState);
    bedrock.next(choice);
    const definition = emotion.next(bedrock);

    //statemachine
    const stateMachine = new sfn.StateMachine(this, "stateMachine", {
      definition,
      timeout: cdk.Duration.minutes(15),
      stateMachineType: sfn.StateMachineType.EXPRESS,
    });

    //lambda role
    emotionLambda.grantInvoke(stateMachine.role);
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
    const bucket = new s3.Bucket(this, "Bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: { origin: new origins.S3Origin(bucket) }, // Automatically creates an Origin Access Identity
    });

    const deployment = new s3deploy.BucketDeployment(this, "BucketDeployment", {
      sources: [s3deploy.Source.asset("assets")],
      destinationBucket: bucket,
      retainOnDelete: false,
      distribution, // Automatically invalidate distribution's edge cache
    });
  }
}
