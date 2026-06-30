//TemplateSearchModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Sparkles } from "lucide-react";
import "../styles/template-search-modal.css";

const TemplateSearchModal = ({ vtId, onSelectTemplate, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/vet-templates/${vtId}`
      );
      const data = await response.json();
      const activeTemplates = data.filter((t) => t.is_active === "yes");
      setTemplates(activeTemplates);
      setFilteredTemplates(activeTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [vtId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = templates.filter(
      (template) =>
        template.category.toLowerCase().includes(query) ||
        template.keywords.toLowerCase().includes(query) ||
        template.template_message.toLowerCase().includes(query)
    );

    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="template-search-modal-overlay" onClick={onClose}>
      <div
        className="template-search-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="template-search-header">
          <h3>
            <Sparkles size={20} />
            Search Reply Templates
          </h3>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="template-search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="template-search-input"
            placeholder="Search by category, keyword, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="template-search-results">
          {loading ? (
            <p className="loading-text">Loading templates...</p>
          ) : filteredTemplates.length === 0 ? (
            <p className="no-results-text">No templates found</p>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.template_id}
                className="template-search-card"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="template-card-header">
                  <span className="template-category">{template.category}</span>
                  <span className="template-usage">
                    Used {template.usage_count}x
                  </span>
                </div>
                <p className="template-message">{template.template_message}</p>
                <div className="template-keywords">
                  {template.keywords.split(",").map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSearchModal;
