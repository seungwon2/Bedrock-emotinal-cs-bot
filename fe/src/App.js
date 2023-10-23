import "./App.css";
import React from "react";
import styled from "styled-components";
import reviews from "./review";
import Card from "./card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

function App() {
  console.log(reviews);

  const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    background: #343434;
  `;

  const Title = styled.h1`
    text-align: center;
    font-weight: 900;
    font-size: 90px;
    color: #e2e2e2;
    margin-top: 3rem;
    margin-bottom: 3rem;
  `;
  const InnerWrapper = styled.div`
    display: flex;
    flex-direction: column;
  `;

  const Image = styled.img`
    width: 200px;
  `;
  const Subtitle = styled.div`
    display: flex;
    justify-content: center;
    color: #e2e2e2;
    font-size: 30px;
    font-weight: 700;
  `;

  const Contents = styled.div`
    color: #e2e2e2;
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  `;
  return (
    <Wrapper>
      <Container>
        <Row className="justify-content-md-center">
          <Title>Customer Service bot</Title>
        </Row>
        <Row className="justify-content-md-center">
          <Image src="/bedrock.jpeg"></Image>
        </Row>
        <Row className="justify-content-md-center">
          <Subtitle>Amazon Bedrock</Subtitle>
        </Row>
        <Contents>
          이 사이트는 Amazon Bedrock 서비스를 이용해 고객의 리뷰에 대한 답변을
          자동화하는 Customer Service bot 데모를 구현했습니다.
          <br />
          이 데모는 Amazon Bedrock 서비스에서 지원하는 다양한 Foundation Model
          중 ANTROPIC의 CLAUDE v2 모델을 사용하였습니다.
          <br />
        </Contents>
        <Row className="justify-content-md-center">
          {reviews.products.map((product) => (
            <Card
              content={product.comment}
              index={product.index}
              user={product.user}
            />
          ))}
        </Row>
      </Container>
    </Wrapper>
  );
}

export default App;
