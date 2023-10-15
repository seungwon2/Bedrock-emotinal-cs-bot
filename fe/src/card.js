import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import Button from "react-bootstrap/Button";

export default function Card(props) {
  const [clicked, setClicked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generated, setGenerated] = useState("hi");
  const [modify, setModify] = useState(generated);

  async function handleOnClick() {
    setClicked(true);
    await axios
      .post(
        "https://cors-anywhere.herokuapp.com/https://wneol25oo1.execute-api.us-east-1.amazonaws.com/prod/",
        {
          input: "이 댓글에 대한 사장님의 리뷰를 작성해줘." + props.content,
          stateMachineArn:
            "arn:aws:states:us-east-1:105236167405:stateMachine:stateMachineE926C166-xV273wDj9wtB",
        }
      )
      .then(function (res) {
        console.log(res.data);
        setModify(res.data.generated);
      })
      .catch(function (err) {
        console.log(err.response.data);
      });
  }
  const handleChange = (e) => {
    setModify(e.target.value);
    console.log("modify: " + modify);
  };
  const handleSubmit = () => {
    setSubmitted(true);
    setClicked(false);
  };
  return (
    <Wrapper>
      <Upper>
        <Title>Review #{props.index}</Title>
      </Upper>
      <Content>{props.content}</Content>
      <ButtonWrapper>
        <Button variant="success" onClick={handleOnClick}>
          Generate
        </Button>
      </ButtonWrapper>
      {clicked && (
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
          <Title>Reply: </Title>
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
  margin: 0;
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
