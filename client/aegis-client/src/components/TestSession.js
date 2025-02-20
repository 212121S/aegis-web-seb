import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function TestSession() {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);
  const startTime = useRef(null);
  const timerRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initializeTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const initializeTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams(location.search);
      const paymentSessionId = searchParams.get("session_id");
      
      const res = await axios.post(
        "http://localhost:4000/api/exam/initialize",
        { 
          type: paymentSessionId ? "practice" : "official",
          paymentSessionId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }

      setSessionId(res.data.sessionId);
      startRecording();
      fetchNextQuestion(res.data.sessionId);
      startTimer();
    } catch (err) {
      console.error(err);
      alert("Failed to initialize test");
    }
  };

  const startTimer = () => {
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const formData = new FormData();
        formData.append("recording", blob);
        
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `http://localhost:4000/api/exam/${sessionId}/recording`,
            formData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error("Failed to upload recording:", err);
        }
      };
      
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Please enable camera and microphone access");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const fetchNextQuestion = async (sid) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:4000/api/exam/${sid || sessionId}/next`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.completed) {
        await finalizeTest();
        return;
      }

      setCurrentQuestion(res.data);
      startTime.current = Date.now();
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch next question");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selected) return;

    const token = localStorage.getItem("token");
    const questionTimeSpent = Math.floor((Date.now() - startTime.current) / 1000);

    try {
      const res = await axios.post(
        `http://localhost:4000/api/exam/${sessionId}/answer`,
        {
          questionId: currentQuestion._id,
          answer: selected,
          timeSpent: questionTimeSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScore(res.data.currentScore);
      setIncorrectAnswers(res.data.incorrectAnswers);
      setSelected("");
      
      if (res.data.incorrectAnswers >= 5) {
        await finalizeTest();
      } else {
        fetchNextQuestion();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit answer");
    }
  };

  const finalizeTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:4000/api/exam/${sessionId}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTestComplete(true);
      setTestResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to finalize test");
    }
  };

  if (loading) {
    return (
      <div className="test-session loading">
        <h2>Loading test session...</h2>
      </div>
    );
  }

  if (testComplete) {
    return (
      <div className="test-session results">
        <h2>Test Complete</h2>
        <div className="score-section">
          <h3>Final Score: {testResults.finalScore.toFixed(2)}</h3>
          <p>Percentile: {testResults.percentile.toFixed(1)}%</p>
        </div>
        <div className="analytics-section">
          <h3>Performance Breakdown</h3>
          {testResults.questionBreakdown.map((cat, idx) => (
            <div key={idx} className="category-stats">
              <h4>{cat.category}</h4>
              <p>Correct: {cat.correct} / {cat.total}</p>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{width: `${(cat.correct/cat.total)*100}%`}}
                />
              </div>
            </div>
          ))}
          <div className="additional-stats">
            <p>Average Difficulty: {testResults.averageDifficulty.toFixed(1)}</p>
            <p>Average Time per Question: {testResults.timePerQuestion.toFixed(1)}s</p>
          </div>
        </div>
        <button onClick={() => navigate("/dashboard")}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="test-session active">
      <div className="status-bar">
        <div className="recording-status">
          {recording ? "🔴 Recording" : "⚪ Not Recording"}
        </div>
        <div className="score">Score: {score.toFixed(2)}</div>
        <div className="timer">Time: {Math.floor(timeSpent/60)}:{(timeSpent%60).toString().padStart(2, '0')}</div>
        <div className="lives">❌ {incorrectAnswers}/5</div>
      </div>
      
      <div className="question-container">
        <div className="difficulty-indicator">
          Difficulty: {"⭐".repeat(Math.round(currentQuestion.difficulty))}
        </div>
        
        <h3>Question</h3>
        <p className="prompt">{currentQuestion.prompt}</p>
        
        <div className="choices">
          {currentQuestion.choices.map((choice, idx) => (
            <label key={idx} className="choice">
              <input
                type="radio"
                name="answer"
                value={choice}
                checked={selected === choice}
                onChange={(e) => setSelected(e.target.value)}
              />
              <span className="choice-text">{choice}</span>
            </label>
          ))}
        </div>
        
        <button 
          className="submit-btn"
          onClick={handleSubmitAnswer}
          disabled={!selected}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

export default TestSession;
