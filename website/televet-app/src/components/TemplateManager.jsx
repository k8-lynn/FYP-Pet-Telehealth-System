//TemplateManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import "../styles/template-manager.css";

const TemplateManager = ({ vtId, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    category: "",
    keywords: "",
    template_message: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vtId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/vet-templates/${vtId}`
      );
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, [vtId]); // Add vtId as dependency

  const handleCreate = async () => {
    try {
      await fetch("http://localhost:5000/api/vet-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vt_id: vtId, ...newTemplate }),
      });

      setNewTemplate({ category: "", keywords: "", template_message: "" });
      setShowAddForm(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleUpdate = async (templateId, updates) => {
    try {
      await fetch(`http://localhost:5000/api/vet-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Delete this template?")) return; // Change this line

    try {
      await fetch(`http://localhost:5000/api/vet-templates/${templateId}`, {
        method: "DELETE",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  return (
    <div className="template-manager-modal">
      <div className="template-manager-content">
        <div className="template-manager-header">
          <h2>Manage Reply Templates</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="template-manager-body">
          <button
            className="add-template-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={18} />
            Add New Template
          </button>

          {showAddForm && (
            <div className="template-form">
              <input
                type="text"
                placeholder="Category (e.g., Skin Issues)"
                value={newTemplate.category}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, category: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Keywords (comma-separated)"
                value={newTemplate.keywords}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, keywords: e.target.value })
                }
              />
              <textarea
                placeholder="Template message..."
                value={newTemplate.template_message}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    template_message: e.target.value,
                  })
                }
                rows={4}
              />
              <div className="form-actions">
                <button onClick={handleCreate} className="save-btn">
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="templates-list">
            {templates.map((template) => (
              <div key={template.template_id} className="template-item">
                {editingId === template.template_id ? (
                  <EditTemplateForm
                    template={template}
                    onSave={(updates) =>
                      handleUpdate(template.template_id, updates)
                    }
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="template-header">
                      <span className="template-category">
                        {template.category}
                      </span>
                      <span className="template-usage">
                        Used {template.usage_count} times
                      </span>
                    </div>
                    <p className="template-text">{template.template_message}</p>
                    <div className="template-keywords">
                      {template.keywords.split(",").map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="template-actions">
                      <button
                        onClick={() => setEditingId(template.template_id)}
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.template_id)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                      <button
                        onClick={() =>
                          handleUpdate(template.template_id, {
                            ...template,
                            is_active:
                              template.is_active === "yes" ? "no" : "yes",
                          })
                        }
                        className={
                          template.is_active === "yes" ? "active" : "inactive"
                        }
                      >
                        {template.is_active === "yes" ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditTemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState(template);

  return (
    <div className="template-form">
      <input
        type="text"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      />
      <input
        type="text"
        value={formData.keywords}
        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
      />
      <textarea
        value={formData.template_message}
        onChange={(e) =>
          setFormData({ ...formData, template_message: e.target.value })
        }
        rows={4}
      />
      <div className="form-actions">
        <button onClick={() => onSave(formData)} className="save-btn">
          <Save size={16} /> Save
        </button>
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TemplateManager;
