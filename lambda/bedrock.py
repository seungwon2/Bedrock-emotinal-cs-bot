import boto3
import json
import botocore

def lambda_handler(event, context):
    # TODO implement

    input = event['input']
    info = event['info']
    user = event['user']

    print(input)
    print(user)
    config = botocore.config.Config(
    retries = dict(
        max_attempts = 10
    ),
    read_timeout = 3000
    )

    bedrock = boto3.client(service_name='bedrock-runtime')
    body = json.dumps({"prompt":f"""\n\nHuman: 
아래의 <example>안에는 <information>과 <user>, <review>와 <result>가 있습니다. <information>은 사용자에게 추천할 제품의 정보이며, <user>는 상품 구매자의 정보를 담고 있습니다. <result>는 <review>를 분석한 감정인 Sentiment와 , 사장님의 입장에서 작성한 답변인 “Generated”가 json 형식으로 나옵니다.

사용자의 Sentiment는 NEGATIVE, POSITIVE, MIXED로 표현됩니다. 분석한 Sentiment가 POSITIVE일 경우에는 <Information>을 반영해 “Generated”를 작성하여 다른 제품을 추천하고, NEGATIVE일 경우에는 <Information>을 반영하지 않고 정중하게 사장님의 입장에서 사과문을 작성합니다. 
<example>
<information>

{{
“age”: “20대”, #주 구매자
“link” : “https://sample1.com”, #제품으로 갈 수 있는 링크
“product” : “북유럽 디자인 수건” #추천 제품명
}}

</information>

<user>
{{
        “age”: "20대", #구매자 연령
        “sex”: "여", #구매자 성별
        “name”: "백조", #구매자 이름
        “purchased”: "3", #구매 횟수
        “product”: "폭신 구름 슬리퍼", #구매한 상품 이름
 }}

</user>


<review>
쿠션감도 좋고 편하다는 평이 많아서 사봤는데 처음 시착 때는 몰랐다가 조금 서있어보니까 쿠션감이 슬슬 느껴지고 아치도 있어서 좋더라구요?! 다만 가격이 사악할 뿐..... 가격이 별점 깎아먹습니다!!! 일단 실내용으로 샀는데 실사용 해보고 여전히 만족스럽다면 슬리퍼 이걸로 정착하게 계속 팔아주세요~!
</review>

<result>

{{“Sentiment”: “MIXED”,
“Generated”: “백조님, 소중한 리뷰 감사드립니다. 제품 재구매도 벌써 세 번째이시네요. 계속해서 제품을 이용해주셔서 진심으로 고맙습니다. 이번에도 제품이 마음에 드셨다니 다행이고 기쁘게 생각합니다. 저희가 앞으로도 고객님의 취향에 맞는 제품을 개발할 수 있도록 최선을 다하겠습니다. 이 제품을 구매한 다른 고객님들이 많이 구매하신 폭신 구름 슬리퍼(https://sample1.com)도 한 번 이용해보세요. 고객님의 소중한 의견이 큰 도움이 됩니다. 항상 감사드립니다.”}}
</result>
</example>

아래의 <review>와 <information>, <user>에 대해서 위의 <result>를 생성해주세요. 응답은 반드시 {{}}안의 내용을 json 형식으로 주고, Generate 안의 내용에 엔터를 제거하고 출력합니다.

<information>

{info}

</information>

<user>
{user}
</user>
<review>
{input}
</review>\n\nAssistant:""", "max_tokens_to_sample": 900,
                       "temperature": 0.5, "top_p": 1, "top_k": 250, "stop_sequences":  ["\n\nHuman:"],
                       }, ensure_ascii=False)
 
    response = bedrock.invoke_model(
        accept='*/*',
        body=body,
        contentType='application/json',
        modelId='anthropic.claude-v2'
        )
    

    response_body = json.loads(response.get('body').read())

    answer = response_body['completion']
    start_index = answer.find("{")
    end_index = answer.rfind("}")
    json_string = answer[start_index:end_index+1]
    print(json_string)
    
    json_string = json.loads(json_string)
    print(type(json_string))
    
    temp = json_string
    
    print(temp)
    result = {}
 
    result['input'] = event['input']
    result['generated'] = temp['Generated']
    result['emotion'] = temp['Sentiment']
    
    return result
    
    