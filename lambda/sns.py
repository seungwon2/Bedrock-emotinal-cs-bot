import boto3
import os

TOPICARN=os.environ['TOPICARN']

def lambda_handler(event, context):
    emotion = event['emotion']
    input = event['input']
    generated = event['generated']
    
    client = boto3.client('sns')
    response = client.publish(
    TopicArn=TOPICARN,
    Message=f"""사용자로부터 받은 피드백이 도착했습니다. 사용자 피드백: {input}, 자동 생성 메세지: {generated}""",
    Subject='사용자 피드백 알림',
    )

    result = {}
    
    result['emotion'] = emotion
    result['input'] = input
    result['generated'] = generated
    return result