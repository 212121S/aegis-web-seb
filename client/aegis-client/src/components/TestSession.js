import React, { useEffect, useState } from "react";
import axios from "axios";

function TestSession() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/exam/questions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selected) return;

    // Compare
    if (selected === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
    setCurrentIndex(currentIndex + 1);
    setSelected("");
  };

  const handleFinishExam = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:4000/api/exam/submit",
        { score, totalQuestions: questions.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Exam finished! Your score: ${score}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!questions.length) {
    return <div>Loading questions...</div>;
  }

  if (currentIndex >= questions.length) {
    return (
      <div>
        <h2>Exam Complete</h2>
        <button onClick={handleFinishExam}>Submit Score</button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div>
      <h3>Question {currentIndex + 1}</h3>
      <p>{q.prompt}</p>
      {q.choices.map((choice, idx) => (
        <div key={idx}>
          <input
            type="radio"
            name="answer"
            checked={selected === choice}
            onChange={() => setSelected(choice)}
          />
          {choice}
        </div>
      ))}
      <button onClick={handleSubmitAnswer}>Submit Answer</button>
    </div>
  );
}

export default TestSession;