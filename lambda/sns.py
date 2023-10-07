import boto3

def lambda_handler(event, context):
    emotion = event['emotion']
    input = event['input']
    generated = event['generated']
    
    client = boto3.client('sns')
    response = client.publish(
    TopicArn='arn:aws:sns:us-east-1:105236167405:badComments',
    Message=f"""사용자로부터 받은 피드백이 도착했습니다. 사용자 피드백: {input}, 자동 생성 메세지: {generated}""",
    Subject='문자',
    )