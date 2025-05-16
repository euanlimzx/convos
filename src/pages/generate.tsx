import { useState } from "react";

export default function GeneratePage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQuestion("");

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examples: [
            "What’s a memory you wish you could relive?",
            "What’s something small that recently made your day better?",
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQuestion(data.question);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch question.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Question"}
      </button>

      {question && (
        <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{question}</p>
      )}

      {error && <p style={{ marginTop: "1rem", color: "red" }}>{error}</p>}
    </div>
  );
}
