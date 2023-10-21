import os
import boto3

ESCALATION_INTENT_MESSAGE = "Seems that you are having troubles with our service. Would you like to be transferred to the associate?"
FULFILMENT_CLOSURE_MESSAGE = "Seems that you are having troubles with our service. Let me transfer you to the associate."

escalation_intent_name = os.getenv('ESCALATION_INTENT_NAME', None)

sagemaker = boto3.client('runtime.sagemaker')
comprehend = boto3.client('comprehend')


def lambda_handler(event, context):
    event = event['body']
    emotion_result = emotion_detect(event, context)
    emotion = emotion_result["sessionAttributes"]["sentiment"]
  
    print(event)
    
    result = {}
    
    result['emotion'] = emotion
    result['input'] = event['input']

    return result

def emotion_detect(event, context):
    sentiment = comprehend.detect_sentiment(
        Text=event['input'], LanguageCode='ko')['Sentiment']
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
            }
        }
    return result
