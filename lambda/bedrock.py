import boto3
import json
def lambda_handler(event, context):
    # TODO implement
    emotion = event['emotion']
    input = event['input']
    
    bedrock = boto3.client(service_name='bedrock-runtime')
    body = json.dumps({"prompt":f"""\n\nHuman:{input} \n\nAssistant:""", "max_tokens_to_sample": 300,
                       "temperature": 0.5, "top_p": 1, "top_k": 250, "stop_sequences":  ["\n\nHuman:"],
                       })

    response = bedrock.invoke_model(
        accept='*/*',
        body=body,
        contentType='application/json',
        modelId='anthropic.claude-v2'
    )
    response_body = json.loads(response.get('body').read())
    answer = response_body['completion']
    
    result = {}
    result['emotion'] = event['emotion']
    result['input'] = event['input']
    result['generated'] = response_body['completion']
    
    return result
    
    