import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class EmotionchatbotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //lambda
    const emotionLambda = new lambda.Function(this, "emotion", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/emotion.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.PYTHON_3_9,
    });
    const bedrockLambda = new lambda.Function(this, "bedrock", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/bedrock.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.PYTHON_3_9,
    });
    const snsLambda = new lambda.Function(this, "sns", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/sns.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.PYTHON_3_9,
    });

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
    const choice = new sfn.Choice(this, "Did it work?");
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
    const definition = emotion.next(bedrock);

    //statemachine
    const stateMachine = new sfn.StateMachine(this, "stateMachine", {
      definition,
      timeout: cdk.Duration.minutes(5),
      stateMachineType: sfn.StateMachineType.EXPRESS,
    });

    //lambda role
    emotionLambda.grantInvoke(stateMachine.role);
    bedrockLambda.grantInvoke(stateMachine.role);
    snsLambda.grantInvoke(stateMachine.role);

    //api gateway
    const api = new apigateway.StepFunctionsRestApi(
      this,
      "StepFunctionsRestApi",
      { stateMachine: stateMachine }
    );
  }
}
