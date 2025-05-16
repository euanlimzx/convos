"use client";
import { useState, useEffect } from "react";
import { initialQuestions } from "../consts/questions";
import { shuffleArray } from "@/utils/shuffle";

export default function GeneratePage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔀 Shuffle only once on client
  useEffect(() => {
    const shuffled = shuffleArray(initialQuestions);
    setQuestions(shuffled);
  }, []);

  const currentQuestion =
    questions && currentIndex < questions.length
      ? questions[currentIndex]
      : "No more questions.";

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examples: liked }),
      });

      const data = await response.json();

      if (response.ok) {
        const updated = [...questions];
        updated[currentIndex] = data.question;
        setQuestions(updated);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch question.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (liked.length > 5) {
      setLiked((prev) => prev.slice(1));
    }
  }, [liked]);

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setQuestions([...questions, ""]);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleLike = () => {
    if (currentQuestion) {
      setLiked([...liked, currentQuestion]);
    }
    handleSkip();
  };

  return (
    <div
      style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}
    >
      <h2>Question</h2>
      <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
        {loading ? "Loading..." : currentQuestion}
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleSkip}
          disabled={loading}
          style={{ marginRight: "1rem" }}
        >
          Skip
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ marginRight: "1rem" }}
        >
          Replace
        </button>
        <button onClick={handleLike} disabled={loading}>
          Like & Next
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {liked.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Liked Questions</h3>
          <ul
            style={{ textAlign: "left", maxWidth: "500px", margin: "0 auto" }}
          >
            {liked.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
