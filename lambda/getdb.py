import os
import boto3
from boto3.dynamodb.conditions import Attr

DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
REGION = os.environ['REGION']

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event, context):

    event = event['body']
    user = event['info']
    result = {}
 
    response = table.scan(TableName=DYNAMODB_TABLE_NAME)
    items = response.get('Items', [])

    if not items:
        putSample()
    else:
        print("DynamoDB 테이블에 아이템이 있습니다.")
   
    information = match(user)

    result['input'] = event['input']
    result['info'] =  information[0]
    result['user'] = user
    
    return result

def putSample():
    sample_items = [
        {"age": "10대", "link": "https://sample1.com", "product": "짱구 잠옷"},
        {"age": "20대", "link": "https://sample2.com", "product": "북유럽 디자인 수건"},
        {"age": "30대", "link": "https://sample3.com", "product": "김치찌개"}
        # 추가할 아이템들을 이곳에 계속 추가하세요
    ]
    for item in sample_items:
        try:
            response = table.put_item(Item=item)
            print(f"Item added successfully: {item}")
        except Exception as e:
            print(f"Error adding item {item}: {e}")
            # 예외 처리를 원하는 대로 추가하세요

def match(user):
    age = user['age']
    response = table.scan(FilterExpression=Attr('age').eq(age))
    items = response.get('Items', [])

    return items