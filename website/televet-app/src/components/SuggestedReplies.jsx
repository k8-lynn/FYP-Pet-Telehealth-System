//SuggestedReplies.jsx
import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Sparkles } from "lucide-react";
import "../styles/suggested-replies.css";

const SuggestedReplies = ({ message, vtId, onSelectReply, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasAnalyzedRef = useRef(false);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    if (!message || !vtId) return;

    // Only analyze if it's a new message
    if (lastMessageIdRef.current === message.msg_id) return;

    const analyzeMessage = async () => {
      setLoading(true);
      hasAnalyzedRef.current = true;
      lastMessageIdRef.current = message.msg_id;

      try {
        const response = await fetch(
          "http://localhost:5000/api/vet-templates/analyze",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vt_id: vtId, message: message.msg }),
          }
        );

        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error analyzing message:", error);
      } finally {
        setLoading(false);
      }
    };

    analyzeMessage();
  }, [message, vtId]);

  const handleSelectReply = (template) => {
    onSelectReply(template);
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (loading || !suggestions.length) return null;

  return (
    <div className="suggested-replies-modal-overlay" onClick={handleClose}>
      <div
        className="suggested-replies-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="suggested-replies-header">
          <div className="header-left">
            <Sparkles size={14} />
            <span>Suggested Replies</span>
          </div>
          <button className="close-suggestions-btn" onClick={handleClose}>
            <X size={14} />
          </button>
        </div>
        <div className="suggested-replies-list">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.template_id}
              className="suggested-reply-card"
              onClick={() => handleSelectReply(suggestion)}
            >
              <div className="suggestion-header">
                <span className="suggestion-category">
                  {suggestion.category}
                </span>
                <span className="suggestion-score">
                  {suggestion.match_score} match
                  {suggestion.match_score > 1 ? "es" : ""}
                </span>
              </div>
              <p className="suggestion-text">{suggestion.template_message}</p>
              <div className="suggestion-keywords">
                {suggestion.matched_keywords.map((keyword, idx) => (
                  <span key={idx} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedReplies;
