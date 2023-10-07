import json
import boto3


def lambda_handler(event, context):
    # TODO implement
    bedrock = boto3.client(service_name='bedrock-runtime')

    body = json.dumps({"prompt": "안녕하세요", "max_tokens_to_sampl": 300,
                       "temperature": 0.5, "topP": 1, "top_k": 250, "stop_sequences":  ["\n\nHuman:"],
                       })

    response = bedrock.invoke_model(
        accept='*/*',
        body=body,
        contentType='application/json',
        modelId='anthropic.claude-v2'
    )
    response_body = json.loads(response.get('body').read())
    print(response_body)


def lambda_handler(event, context):

    bedrock = boto3.client(service_name='bedrock-runtime')

    modelId = 'ai21.j2-mid-v1'
    accept = 'application/json'
    contentType = 'application/json'

    response = bedrock.invoke_model(
        body=body, modelId=modelId, accept=accept, contentType=contentType)

    response_body = json.loads(response.get('body').read())

    # text
    print(response_body.get("completions")[0].get("data").get("text"))
