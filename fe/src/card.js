import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Badge from "react-bootstrap/Badge";

export default function Card(props) {
  const [clicked, setClicked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generated, setGenerated] = useState("hi");
  const [modify, setModify] = useState(generated);

  async function handleOnClick() {
    setClicked(true);
    await axios
      .post(process.env.REACT_APP_API, {
        input: props.content,
        info: props.user,
        stateMachineArn: process.env.REACT_APP_STATEMACHINE,
      })
      .then(function (res) {
        console.log(res.data);
        setModify(
          "(AI가 작성한 답변입니다. 답변을 반드시 확인한 후 제출해주세요.) " +
            res.data.generated
        );
        setLoaded(true);
        setClicked(false);
      })
      .catch(function (err) {
        console.log(err.response.data);
        console.log(props.user);
      });
  }
  const handleChange = (e) => {
    setModify(e.target.value);
    console.log("modify: " + modify);
  };
  const handleSubmit = () => {
    setSubmitted(true);
    setLoaded(false);
  };
  return (
    <Wrapper>
      <Upper>
        <Title>Review #{props.index}</Title>
      </Upper>

      <Profile>
        <Product>{props.user.product}</Product>
        <User>
          <img src="/profile.png" width="50px" />
          {props.user.name}·{props.user.sex}·{props.user.age}&nbsp;&nbsp;
          <Badge bg="info">{props.user.purchased}번째 구매</Badge>
        </User>
      </Profile>
      <Content>{props.content}</Content>
      <ButtonWrapper>
        <Button variant="success" onClick={handleOnClick}>
          Generate
        </Button>
      </ButtonWrapper>
      {clicked && (
        <Loading>
          <SpinnerWrapper>
            <Spinner animation="border" variant="light" />
          </SpinnerWrapper>
          <Text>답변 생성 중 .. </Text>
        </Loading>
      )}
      {loaded && (
        <>
          <Reply value={modify} onChange={handleChange} />
          <ButtonWrapper>
            <Button variant="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </ButtonWrapper>
        </>
      )}
      {submitted && (
        <>
          <P>답변</P>
          <Content>{modify}</Content>
        </>
      )}
    </Wrapper>
  );
}
const Wrapper = styled.div`
  display: flex;
  justify-content: space-around;
  border-radius: 3rem;
  flex-direction: column;
  width: 80%;
  margin: 3rem;
`;
const Upper = styled.div`
  background: #ccd0d5;
  border-radius: 2rem 2rem 0 0;
  text-align: center;
  height: 3rem;
  align-items: center;
  display: flex;
  justify-content: center;
`;
const Title = styled.p`
  margin: 1rem 0;
  font-weight: bold;
`;
const P = styled.p`
  margin: 1rem 0;
  color: white;
  font-weight: bold;
`;
const Content = styled.div`
  display: flex;
  color: #e2e2e2;
  padding: 1.5rem;
  border: solid 1px #e2e2e2;
`;
const Reply = styled.textarea`
  height: 200px;
  padding: 10px;
  box-sizing: border-box;
  border: solid 2px #1e90ff;
  border-radius: 5px;
  font-size: 16px;
  resize: both;
`;
const ButtonWrapper = styled.div`
  display: block;
  margin: 1rem 0rem 1rem 1rem;
  text-align: end;
`;
const Text = styled.p`
  color: white;
  margin: 1rem 0;
`;
const Loading = styled.div`
  display: flex;
  justify-content: center;
  margin: auto;
  flex-direction: column;
`;
const SpinnerWrapper = styled.div`
  margin: auto;
`;
const Profile = styled.div`
  display: flex;
  color: #e2e2e2;
  font-size: 0.9rem;
  padding: 0.5rem 1.5rem;
  border-left: solid 1px #e2e2e2;
  border-right: solid 1px #e2e2e2;
  align-items: center;
  justify-content: space-between;
`;
const Product = styled.p`
  font-size: 1.3rem;
  font-weight: bold;
  margin: auto 0;
`;
const User = styled.div``;
