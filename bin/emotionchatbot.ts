#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EmotionchatbotStack } from "../lib/emotionchatbot-stack";
import { UserInterfaceStack } from "../lib/user-interface-stack";

const app = new cdk.App();
new EmotionchatbotStack(app, "EmotionchatbotStack");
new UserInterfaceStack(app, "UserInterfaceStack");
