// TemplateManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import "../styles/template-manager.css";

const TemplateManager = ({ vtId, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // State for the "Add New" form
  const [newTemplate, setNewTemplate] = useState({
    category: "",
    keywords: "",
    template_message: "",
  });
  
  // State to toggle between Dropdown vs Text Input for "Add New" form
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);

  // 1. Calculate Unique Categories from loaded templates
  const uniqueCategories = [...new Set(templates.map(t => t.category))]
    .filter(c => c && c.trim() !== "")
    .sort();

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
  }, [vtId]);

  const handleCreate = async () => {
    if (!newTemplate.category) {
        alert("Please select or enter a category");
        return;
    }

    try {
      await fetch("http://localhost:5000/api/vet-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vt_id: vtId, ...newTemplate }),
      });

      setNewTemplate({ category: "", keywords: "", template_message: "" });
      setShowAddForm(false);
      setIsCustomCategory(false); // Reset custom toggle
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
    if (!window.confirm("Delete this template?")) return;

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
            onClick={() => {
                setShowAddForm(!showAddForm);
                setIsCustomCategory(false); // Reset to dropdown when opening
            }}
          >
            <Plus size={18} />
            Add New Template
          </button>

          {showAddForm && (
            <div className="template-form">
              {/* ▼▼▼ REPLACED INPUT WITH SMART DROPDOWN ▼▼▼ */}
              <CategorySelector 
                uniqueCategories={uniqueCategories}
                value={newTemplate.category}
                isCustom={isCustomCategory}
                setIsCustom={setIsCustomCategory}
                onChange={(val) => setNewTemplate({...newTemplate, category: val})}
              />
              {/* ▲▲▲ END REPLACEMENT ▲▲▲ */}

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
                    uniqueCategories={uniqueCategories} // Pass categories to edit form
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

// 2. Updated Edit Form to include Dropdown logic
const EditTemplateForm = ({ template, uniqueCategories, onSave, onCancel }) => {
  const [formData, setFormData] = useState(template);
  const [isCustom, setIsCustom] = useState(false);

  return (
    <div className="template-form">
      {/* ▼▼▼ REPLACED INPUT WITH SMART DROPDOWN ▼▼▼ */}
      <CategorySelector 
         uniqueCategories={uniqueCategories}
         value={formData.category}
         isCustom={isCustom}
         setIsCustom={setIsCustom}
         onChange={(val) => setFormData({...formData, category: val})}
      />
      {/* ▲▲▲ END REPLACEMENT ▲▲▲ */}

      <input
        type="text"
        value={formData.keywords}
        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
        placeholder="Keywords"
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

// 3. New Helper Component for the Category Logic
const CategorySelector = ({ uniqueCategories, value, isCustom, setIsCustom, onChange }) => {
    // If no existing categories, just show text input
    if (!uniqueCategories || uniqueCategories.length === 0) {
        return (
            <input
                type="text"
                placeholder="Category (e.g., Skin Issues)"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
            />
        );
    }

    // If user selected "Add New", show text input with Back button
    if (isCustom) {
        return (
            <div style={{ display: "flex", gap: "8px", width: "100%", marginBottom: "0.5rem" }}>
                <input
                    type="text"
                    placeholder="Type new category name..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    style={{ flex: 1, marginBottom: 0 }}
                />
                <button
                    onClick={() => {
                        setIsCustom(false);
                        onChange(""); // Clear value when going back to dropdown
                    }}
                    className="cancel-btn"
                    style={{ padding: "0 12px", height: "42px", display: "flex", alignItems: "center" }}
                    title="Back to list"
                >
                    Back
                </button>
            </div>
        );
    }

    // Default: Show Dropdown
    return (
        <select
            value={uniqueCategories.includes(value) ? value : ""}
            onChange={(e) => {
                if (e.target.value === "___NEW___") {
                    setIsCustom(true);
                    onChange("");
                } else {
                    onChange(e.target.value);
                }
            }}
            style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                marginBottom: "0.5rem",
                backgroundColor: "white",
                fontSize: "0.95rem"
            }}
        >
            <option value="" disabled>Select a Category</option>
            {uniqueCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
            ))}
            <option value="___NEW___" style={{ fontWeight: "bold", color: "#2563eb" }}>
                + Add New Category
            </option>
        </select>
    );
};

export default TemplateManager;