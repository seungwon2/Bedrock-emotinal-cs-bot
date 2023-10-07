import os
import boto3

ESCALATION_INTENT_MESSAGE = "Seems that you are having troubles with our service. Would you like to be transferred to the associate?"
FULFILMENT_CLOSURE_MESSAGE = "Seems that you are having troubles with our service. Let me transfer you to the associate."
# ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
ENDPOINT_NAME = os.environ['ENDPOINT_NAME']

escalation_intent_name = os.getenv('ESCALATION_INTENT_NAME', None)

sagemaker = boto3.client('runtime.sagemaker')
comprehend = boto3.client('comprehend')


def lambda_handler(event, context):
    emotion_result = emotion_detect(event, context)
    emotion = emotion_result["sessionAttributes"]["sentiment"]
    payload = "아 여기 족발 맛없어 미치겠다"
    response = sagemaker.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                         ContentType='text/csv',
                                         Body=payload)
    print(response)
    if emotion == "NEGATIVE":
        print("dddd")
    else:
        print("ffff")


def emotion_detect(event, context):
    sentiment = comprehend.detect_sentiment(
        Text=event['inputTranscript'], LanguageCode='ko')['Sentiment']
    if sentiment == 'NEGATIVE':
        if escalation_intent_name:
            result = {
                "sessionAttributes": {
                    "sentiment": sentiment
                },
                "dialogAction": {
                    "type": "ConfirmIntent",
                    "message": {
                            "contentType": "PlainText",
                            "content": ESCALATION_INTENT_MESSAGE
                    },
                    "intentName": escalation_intent_name
                }
            }
        else:
            result = {
                "sessionAttributes": {
                    "sentiment": sentiment
                },
                "dialogAction": {
                    "type": "Close",
                    "fulfillmentState": "Failed",
                    "message": {
                            "contentType": "PlainText",
                            "content": FULFILMENT_CLOSURE_MESSAGE
                    }
                }
            }

    else:
        result = {
            "sessionAttributes": {
                "sentiment": sentiment
            },
            "dialogAction": {
                "type": "Delegate",
                "slots": event["currentIntent"]["slots"]
            }
        }
    return result
