//PatientProfileModal.jsx
import React, { useState, useEffect } from "react";
import { X, Activity, FileText, Scale, ChevronDown, Plus } from "lucide-react";
import showStyledAlert from "../utils/styledAlert";

const PatientProfileModal = ({
  petId, // Just pass pet_id
  vtId, // And vet_id
  viewMode = "vet",
  onClose,
  isReadOnly = false,
}) => {
  // All state management inside the component
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeHealthTab, setActiveHealthTab] = useState("details");
  const [activeHealthView, setActiveHealthView] = useState(null);
  const [activeTrackingView, setActiveTrackingView] = useState(null);
  const [examinations, setExaminations] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingRecordType, setEditingRecordType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState({
    documents: [],
    vaccinations: [],
    conditions: [],
    currentMedications: [],
    surgeries: [],
  });
  const [trackingData, setTrackingData] = useState({
    weightLog: [],
    activityLog: [],
    symptomLog: [],
    behaviorLog: [],
  });
  const [expandedExam, setExpandedExam] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalType, setTrackingModalType] = useState(null);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [addRecordType, setAddRecordType] = useState(null);
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] =
    useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allMedications, setAllMedications] = useState([]);
  const [allTreatments, setAllTreatments] = useState([]);
  const [soapNotes, setSoapNotes] = useState([]);

  const [newTrackingEntry, setNewTrackingEntry] = useState({
    date: "",
    weight: "",
    notes: "",
    activityType: "",
    duration: "",
    symptomTitle: "",
    symptomDescription: "",
    behaviorType: "",
    behaviorNote: "",
  });

  const [newRecordData, setNewRecordData] = useState({
    vac_name: "",
    vac_date: "",
    next_date: "",
    vac_notes: "",
    doc_title: "",
    doc_type: "report",
    file_url: "",
    cond_name: "",
    diag_date: "",
    status: "active",
    cond_notes: "",
    surg_name: "",
    surg_date: "",
    surg_notes: "",
    complications: "",
  });

  const [newTreatment, setNewTreatment] = useState({
    type: "",
    dose: "",
    frequency: "",
    duration: "",
    notes: "",
  });

  const [newPrescription, setNewPrescription] = useState({
    medication: "",
    dose: "",
    frequency: "",
    duration: "",
    instructions: "",
    start_date: "",
    end_date: "",
  });

  // Edit Mode Handlers
  const handleEnterEditMode = (exam) => {
    setEditMode(true);
    setEditingExam(JSON.parse(JSON.stringify(exam))); // Deep copy
    setHasUnsavedChanges(false);
  };

  const handleExitEditMode = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      setEditMode(false);
      setEditingExam(null);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setEditMode(false);
    setEditingExam(null);
    setEditingRecord(null);
    setEditingRecordType(null);
    setHasUnsavedChanges(false);
  };

  const handleEditChange = (field, value) => {
    setEditingExam((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleEditTreatment = (index, field, value) => {
    setEditingExam((prev) => {
      const updatedTreatments = [...prev.treatments];
      updatedTreatments[index] = {
        ...updatedTreatments[index],
        [field]: value,
      };
      return { ...prev, treatments: updatedTreatments };
    });
    setHasUnsavedChanges(true);
  };

  const handleEditPrescription = (index, field, value) => {
    setEditingExam((prev) => {
      const updatedPrescriptions = [...prev.prescriptions];
      updatedPrescriptions[index] = {
        ...updatedPrescriptions[index],
        [field]: value,
      };
      return { ...prev, prescriptions: updatedPrescriptions };
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveExamChanges = async () => {
    try {
      // Save main exam details
      await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/examinations/${editingExam.appt_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appt_type: editingExam.appt_type,
            appt_description: editingExam.appt_description,
            appt_status: editingExam.appt_status,
          }),
        }
      );

      // Save treatments
      for (let i = 0; i < editingExam.treatments.length; i++) {
        const treatment = editingExam.treatments[i];
        if (treatment.treat_id) {
          await fetch(
            `https://fyp-pet-telehealth-system.onrender.com/api/treatments/${treatment.treat_id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                treat_type: treatment.type,
                dose: treatment.dose,
                freq: treatment.frequency,
                duration: treatment.duration,
                notes: treatment.notes,
              }),
            }
          );
        }
      }

      // Save prescriptions
      for (let i = 0; i < editingExam.prescriptions.length; i++) {
        const rx = editingExam.prescriptions[i];
        if (rx.rx_id) {
          await fetch(`https://fyp-pet-telehealth-system.onrender.com/api/prescriptions/${rx.rx_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              med_name: rx.medication,
              dose: rx.dose,
              freq: rx.frequency,
              duration: rx.duration,
              instructions: rx.instructions,
              start_date: rx.start_date,
              end_date: rx.end_date,
            }),
          });
        }
      }

      showStyledAlert("Changes saved successfully!");
      setEditMode(false);
      setEditingExam(null);
      setHasUnsavedChanges(false);
      fetchHealthRecords();
    } catch (error) {
      console.error("Error saving changes:", error);
      showStyledAlert("Failed to save changes. Please try again.");
    }
  };

  // Edit handlers for other health records
  const handleEnterRecordEditMode = (record, type) => {
    setEditingRecord(JSON.parse(JSON.stringify(record)));
    setEditingRecordType(type);
    setHasUnsavedChanges(false);
  };

  const handleExitRecordEditMode = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      setEditingRecord(null);
      setEditingRecordType(null);
    }
  };

  const handleRecordEditChange = (field, value) => {
    setEditingRecord((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveRecordChanges = async () => {
    try {
      let endpoint = "";
      let payload = {};

      switch (editingRecordType) {
        case "vaccinations":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/vaccinations/${editingRecord.vac_id}`;
          payload = {
            vac_name: editingRecord.vaccine,
            vac_date: editingRecord.vac_date,
            next_date: editingRecord.next_date,
            notes: editingRecord.notes,
          };
          break;

        case "documents":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/documents/${editingRecord.doc_id}`;
          payload = {
            doc_title: editingRecord.title,
            doc_type: editingRecord.type,
            file_url: editingRecord.file_url,
          };
          break;

        case "conditions":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/conditions/${editingRecord.cond_id}`;
          payload = {
            cond_name: editingRecord.condition,
            diag_date: editingRecord.diag_date,
            status: editingRecord.status,
            notes: editingRecord.notes,
          };
          break;

        case "surgeries":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/surgeries/${editingRecord.surg_id}`;
          payload = {
            surg_name: editingRecord.name,
            surg_date: editingRecord.date,
            notes: editingRecord.notes,
            complications: editingRecord.complications,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showStyledAlert("Changes saved successfully!");
        setEditingRecord(null);
        setEditingRecordType(null);
        setHasUnsavedChanges(false);
        fetchHealthRecords();
      } else {
        showStyledAlert("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving record changes:", error);
      showStyledAlert("Failed to save changes. Please try again.");
    }
  };

  // DELETE HANDLERS
  const handleDeleteRecord = async (recordId, recordType) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      let endpoint = "";

      switch (recordType) {
        case "vaccinations":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/vaccinations/${recordId}`;
          break;
        case "documents":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/documents/${recordId}`;
          break;
        case "conditions":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/conditions/${recordId}`;
          break;
        case "surgeries":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/surgeries/${recordId}`;
          break;
        case "treatments":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/treatments/${recordId}`;
          break;
        case "prescriptions":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/prescriptions/${recordId}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        showStyledAlert("Record deleted successfully!");
        setEditingRecord(null);
        setEditingRecordType(null);
        setEditMode(false);
        setEditingExam(null);
        fetchHealthRecords();
        if (recordType === "treatments" || recordType === "prescriptions") {
          fetchAllMedications();
          fetchAllTreatments();
        }
      } else {
        showStyledAlert("Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      showStyledAlert("Failed to delete record. Please try again.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        showStyledAlert(
          "Invalid file type. Please upload an image, PDF, or Word document."
        );
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showStyledAlert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      showStyledAlert("Please select a file to upload");
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("pet_id", petId);
      formData.append("doc_title", newRecordData.doc_title);
      formData.append("doc_type", newRecordData.doc_type);

      const response = await fetch(
        "https://fyp-pet-telehealth-system.onrender.com/api/pets/upload-document",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        await response.json();
        showStyledAlert("Document uploaded successfully!");
        handleCloseAddRecordModal();
        setSelectedFile(null);
        fetchHealthRecords();
      } else {
        showStyledAlert("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      showStyledAlert("Failed to upload document. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadDocument = (fileUrl, title) => {
    if (!fileUrl) {
      showStyledAlert("No file available");
      return;
    }

    // Force download by fetching and creating blob
    fetch(`https://fyp-pet-telehealth-system.onrender.com${fileUrl}`)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = title || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Download error:", error);
        showStyledAlert("Failed to download file");
      });
  };

  const handleViewDocumentModal = (fileUrl, title) => {
    if (!fileUrl) {
      showStyledAlert("No file available");
      return;
    }

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;  /* Changed from 10000 to 999999 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;

    const container = document.createElement("div");
    container.style.cssText = `
    background: white;
    border-radius: 16px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    position: relative;
  `;

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = `
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: white;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1;
  `;

    closeBtn.onclick = () => document.body.removeChild(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };

    // Check file type
    const fileExtension = fileUrl.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
      const img = document.createElement("img");
      img.src = `https://fyp-pet-telehealth-system.onrender.com${fileUrl}`;
      img.style.cssText = "max-width: 100%; max-height: 90vh; display: block;";
      container.appendChild(img);
    } else if (fileExtension === "pdf") {
      const iframe = document.createElement("iframe");
      iframe.src = `https://fyp-pet-telehealth-system.onrender.com${fileUrl}`;
      iframe.style.cssText = "width: 80vw; height: 90vh; border: none;";
      container.appendChild(iframe);
    } else {
      // For other file types, just download
      handleDownloadDocument(fileUrl, title);
      return;
    }

    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  };

  // Fetch patient details
  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/patients/${petId}`
      );
      const data = await response.json();
      if (response.ok) {
        setSelectedPatient(data);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  // Fetch health records
  const fetchHealthRecords = async () => {
    try {
      const [examRes, historyRes] = await Promise.all([
        fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/examinations`),
        fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/medical-history`),
      ]);

      const examinationsData = await examRes.json();
      const medicalHistoryData = await historyRes.json();

      setExaminations(examinationsData);
      setMedicalHistory({
        documents: medicalHistoryData.documents || [],
        vaccinations: medicalHistoryData.vaccinations || [],
        conditions: medicalHistoryData.conditions || [],
        currentMedications: medicalHistoryData.currentMedications || [],
        surgeries: medicalHistoryData.surgeries || [],
      });
    } catch (error) {
      console.error("Error fetching health records:", error);
      setMedicalHistory({
        documents: [],
        vaccinations: [],
        conditions: [],
        currentMedications: [],
        surgeries: [],
      });
    }
  };

  // Fetch tracking data
  const fetchTrackingData = async () => {
    try {
      const [weightRes, activityRes, symptomRes, behaviorRes] =
        await Promise.all([
          fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/weight-log`),
          fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/activity-log`),
          fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/symptom-log`),
          fetch(`https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/behavior-log`),
        ]);

      setTrackingData({
        weightLog: await weightRes.json(),
        activityLog: await activityRes.json(),
        symptomLog: await symptomRes.json(),
        behaviorLog: await behaviorRes.json(),
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    }
  };

  // Fetch all medications
  const fetchAllMedications = async () => {
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/all-medications`
      );
      const data = await response.json();
      setAllMedications(data);
    } catch (error) {
      console.error("Error fetching medications:", error);
      setAllMedications([]);
    }
  };

  // Fetch all treatments
  const fetchAllTreatments = async () => {
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/all-treatments`
      );
      const data = await response.json();
      setAllTreatments(data);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      setAllTreatments([]);
    }
  };

  // Fetch SOAP notes
  const fetchSoapNotes = async () => {
    try {
      const response = await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/soap-notes`
      );
      const data = await response.json();
      setSoapNotes(data);
    } catch (error) {
      console.error("Error fetching SOAP notes:", error);
      setSoapNotes([]);
    }
  };

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPatientDetails(),
        fetchHealthRecords(),
        fetchTrackingData(),
        fetchAllMedications(),
        fetchAllTreatments(),
        fetchSoapNotes(),
      ]);
      setLoading(false);
    };

    if (petId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  // Tracking Modal Handlers
  const handleOpenTrackingModal = (type) => {
    setTrackingModalType(type);
    setShowTrackingModal(true);
    setNewTrackingEntry({
      date: new Date().toISOString().split("T")[0],
      weight: "",
      notes: "",
      activityType: "",
      duration: "",
      symptomTitle: "",
      symptomDescription: "",
      behaviorType: "",
      behaviorNote: "",
    });
  };

  const handleCloseTrackingModal = () => {
    setShowTrackingModal(false);
    setTrackingModalType(null);
  };

  const handleTrackingInputChange = (field, value) => {
    setNewTrackingEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitTrackingEntry = async () => {
    // Validation
    if (
      trackingModalType === "weight" &&
      (!newTrackingEntry.weight || !newTrackingEntry.date)
    ) {
      showStyledAlert("Please fill in all required fields");
      return;
    }
    if (
      trackingModalType === "activity" &&
      (!newTrackingEntry.activityType ||
        !newTrackingEntry.duration ||
        !newTrackingEntry.date)
    ) {
      showStyledAlert("Please fill in all required fields");
      return;
    }
    if (
      trackingModalType === "symptoms" &&
      (!newTrackingEntry.symptomTitle || !newTrackingEntry.date)
    ) {
      showStyledAlert("Please fill in all required fields");
      return;
    }
    if (
      trackingModalType === "behavior" &&
      (!newTrackingEntry.behaviorType ||
        !newTrackingEntry.behaviorNote ||
        !newTrackingEntry.date)
    ) {
      showStyledAlert("Please fill in all required fields");
      return;
    }

    try {
      let endpoint = "";
      let payload = {};

      switch (trackingModalType) {
        case "weight":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/weight-log`;
          payload = {
            weight: newTrackingEntry.weight,
            rec_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes,
          };
          break;
        case "activity":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/activity-log`;
          payload = {
            activityType: newTrackingEntry.activityType,
            duration: newTrackingEntry.duration,
            activ_date: newTrackingEntry.date,
            notes: newTrackingEntry.notes,
          };
          break;
        case "symptoms":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/symptom-log`;
          payload = {
            symptomTitle: newTrackingEntry.symptomTitle,
            symptomDescription: newTrackingEntry.symptomDescription,
            symp_date: newTrackingEntry.date,
          };
          break;
        case "behavior":
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/behavior-log`;
          payload = {
            behaviorType: newTrackingEntry.behaviorType,
            behaviorNote: newTrackingEntry.behaviorNote,
            behav_date: newTrackingEntry.date,
          };
          break;
      }

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      showStyledAlert("Entry added successfully!");
      handleCloseTrackingModal();
      fetchTrackingData();
    } catch (error) {
      console.error("Error adding tracking entry:", error);
      showStyledAlert("Failed to add entry. Please try again.");
    }
  };

  // Health Record Modal Handlers
  const handleOpenAddRecordModal = (type) => {
    setAddRecordType(type);
    setShowAddRecordModal(true);
    setNewRecordData({
      vac_name: "",
      vac_date: "",
      next_date: "",
      vac_notes: "",
      doc_title: "",
      doc_type: "report",
      file_url: "",
      cond_name: "",
      diag_date: "",
      status: "active",
      cond_notes: "",
      surg_name: "",
      surg_date: "",
      surg_notes: "",
      complications: "",
    });
  };

  const handleCloseAddRecordModal = () => {
    setShowAddRecordModal(false);
    setAddRecordType(null);
    setSelectedFile(null);
  };

  const handleRecordInputChange = (field, value) => {
    setNewRecordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRecord = async () => {
    try {
      let endpoint = "";
      let payload = {};

      switch (addRecordType) {
        case "vaccinations":
          if (!newRecordData.vac_name || !newRecordData.vac_date) {
            showStyledAlert("Please fill in vaccine name and date");
            return;
          }
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/vaccinations`;
          payload = {
            vac_name: newRecordData.vac_name,
            vac_date: newRecordData.vac_date,
            next_date: newRecordData.next_date,
            vt_id: vtId,
            notes: newRecordData.vac_notes,
          };
          break;

        case "documents":
          if (!newRecordData.doc_title || !newRecordData.doc_type) {
            showStyledAlert("Please fill in document title and type");
            return;
          }

          // If file is selected, upload it
          if (selectedFile) {
            await handleUploadDocument();
            return; // Exit early as handleUploadDocument handles the modal closing
          }

          // If no file but has URL, use URL
          if (!newRecordData.file_url) {
            showStyledAlert(
              "Please either upload a file or provide a file URL"
            );
            return;
          }

          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/documents`;
          payload = {
            doc_title: newRecordData.doc_title,
            doc_type: newRecordData.doc_type,
            file_url: newRecordData.file_url,
          };
          break;

        case "conditions":
          if (!newRecordData.cond_name) {
            showStyledAlert("Please fill in condition name");
            return;
          }
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/conditions`;
          payload = {
            cond_name: newRecordData.cond_name,
            diag_date: newRecordData.diag_date,
            status: newRecordData.status,
            notes: newRecordData.cond_notes,
          };
          break;

        case "surgeries":
          if (!newRecordData.surg_name || !newRecordData.surg_date) {
            showStyledAlert("Please fill in surgery name and date");
            return;
          }
          endpoint = `https://fyp-pet-telehealth-system.onrender.com/api/pets/${petId}/surgeries`;
          payload = {
            surg_name: newRecordData.surg_name,
            surg_date: newRecordData.surg_date,
            vt_id: vtId,
            notes: newRecordData.surg_notes,
            complications: newRecordData.complications,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showStyledAlert("Record added successfully!");
        handleCloseAddRecordModal();
        fetchHealthRecords();
      } else {
        showStyledAlert("Failed to add record");
      }
    } catch (error) {
      console.error("Error adding record:", error);
      showStyledAlert("Failed to add record. Please try again.");
    }
  };

  // Treatment & Prescription Handlers
  const handleOpenAddTreatmentModal = (apptId) => {
    setSelectedApptId(apptId);
    setShowAddTreatmentModal(true);
    setNewTreatment({
      type: "",
      dose: "",
      frequency: "",
      duration: "",
      notes: "",
    });
  };

  const handleOpenAddPrescriptionModal = (apptId) => {
    setSelectedApptId(apptId);
    setShowAddPrescriptionModal(true);
    setNewPrescription({
      medication: "",
      dose: "",
      frequency: "",
      duration: "",
      instructions: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    });
  };

  const handleSubmitTreatment = async () => {
    if (!newTreatment.type || !newTreatment.dose) {
      showStyledAlert("Please fill in treatment type and dose");
      return;
    }

    try {
      await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/examinations/${selectedApptId}/treatments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pet_id: petId,
            treat_type: newTreatment.type,
            dose: newTreatment.dose,
            freq: newTreatment.frequency,
            duration: newTreatment.duration,
            notes: newTreatment.notes,
          }),
        }
      );

      showStyledAlert("Treatment added successfully!");
      setShowAddTreatmentModal(false);
      fetchHealthRecords();
    } catch (error) {
      console.error("Error adding treatment:", error);
      showStyledAlert("Failed to add treatment");
    }
  };

  const handleSubmitPrescription = async () => {
    if (!newPrescription.medication || !newPrescription.dose) {
      showStyledAlert("Please fill in medication name and dose");
      return;
    }

    try {
      await fetch(
        `https://fyp-pet-telehealth-system.onrender.com/api/examinations/${selectedApptId}/prescriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pet_id: petId,
            med_name: newPrescription.medication,
            dose: newPrescription.dose,
            freq: newPrescription.frequency,
            duration: newPrescription.duration,
            instructions: newPrescription.instructions,
            start_date: newPrescription.start_date,
            end_date: newPrescription.end_date || null,
          }),
        }
      );

      showStyledAlert("Prescription added successfully!");
      setShowAddPrescriptionModal(false);
      fetchHealthRecords();
    } catch (error) {
      console.error("Error adding prescription:", error);
      showStyledAlert("Failed to add prescription");
    }
  };

  if (loading || !selectedPatient) {
    return (
      <div className="mypatients-modal-overlay" onClick={onClose}>
        <div
          className="mypatients-modal-content health-modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Modal */}
      <div className="mypatients-modal-overlay" onClick={onClose}>
        <div
          className="mypatients-modal-content health-modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mypatients-modal-header">
            <div>
              <h2 className="mypatients-modal-title">
                {selectedPatient.pet_name}'s Complete Profile
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  marginTop: "0.5rem",
                }}
              >
                Patient details, health records, and tracking data
              </p>
            </div>
            <button className="mypatients-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="health-modal-tabs">
            <button
              className={`health-tab ${
                activeHealthTab === "details" ? "active" : ""
              }`}
              onClick={() => setActiveHealthTab("details")}
            >
              Patient Details
            </button>
            <button
              className={`health-tab ${
                activeHealthTab === "records" ? "active" : ""
              }`}
              onClick={() => setActiveHealthTab("records")}
            >
              Health Records
            </button>
            <button
              className={`health-tab ${
                activeHealthTab === "tracking" ? "active" : ""
              }`}
              onClick={() => setActiveHealthTab("tracking")}
            >
              Tracking & Monitoring
            </button>
          </div>

          <div className="health-modal-body">
            {/* Patient Details Tab */}
            {activeHealthTab === "details" && (
              <div className="view-modal-body">
                <div className="view-section">
                  <h3>Pet Information</h3>
                  <div className="view-grid">
                    <div className="view-item">
                      <strong>Pet Name</strong>
                      {selectedPatient.pet_name}
                    </div>
                    <div className="view-item">
                      <strong>Species</strong>
                      {selectedPatient.pet_species}
                    </div>
                    <div className="view-item">
                      <strong>Breed</strong>
                      {selectedPatient.pet_breed || "Not specified"}
                    </div>
                    <div className="view-item">
                      <strong>Age</strong>
                      {selectedPatient.pet_age} years
                    </div>
                    <div className="view-item">
                      <strong>Gender</strong>
                      {selectedPatient.pet_gender === "m" ? "Male" : "Female"}
                    </div>
                    <div className="view-item">
                      <strong>Weight</strong>
                      {selectedPatient.pet_weight
                        ? `${selectedPatient.pet_weight} kg`
                        : "Not specified"}
                    </div>
                  </div>
                </div>

                <div className="view-section">
                  <h3>Medical Information</h3>
                  <div className="view-grid">
                    <div className="view-item">
                      <strong>Vaccination</strong>
                      {selectedPatient.pet_hasVaccination === "yes" ? (
                        <>
                          Yes{" "}
                          {selectedPatient.pet_vaccinationDate &&
                            `(${new Date(
                              selectedPatient.pet_vaccinationDate
                            ).toLocaleDateString()})`}
                        </>
                      ) : (
                        "No"
                      )}
                    </div>
                    <div className="view-item">
                      <strong>Medication</strong>
                      {selectedPatient.pet_hasMedication === "yes"
                        ? "Yes"
                        : "No"}
                    </div>
                    {selectedPatient.pet_hasMedication === "yes" && (
                      <div className="view-item full-width">
                        <strong>Medication Details</strong>
                        {selectedPatient.pet_medicationDetails ||
                          "Not specified"}
                      </div>
                    )}
                    <div className="view-item">
                      <strong>Allergies</strong>
                      {selectedPatient.pet_hasAllergies === "yes"
                        ? "Yes"
                        : "No"}
                    </div>
                    {selectedPatient.pet_hasAllergies === "yes" && (
                      <div className="view-item full-width">
                        <strong>Allergy Details</strong>
                        {selectedPatient.pet_allergyDetails || "Not specified"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="view-section">
                  <h3>Owner Information</h3>
                  <div className="view-grid">
                    <div className="view-item">
                      <strong>Owner Name</strong>
                      {selectedPatient.owner_firstName}{" "}
                      {selectedPatient.owner_lastName}
                    </div>
                    <div className="view-item">
                      <strong>Email</strong>
                      {selectedPatient.owner_email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Records Tab */}
            {activeHealthTab === "records" && (
              <div className="health-records-section">
                {!activeHealthView ? (
                  <div className="health-dashboard-grid">
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("examinations")}
                    >
                      <Activity size={24} />
                      <h4>Examinations</h4>
                      <p>{examinations?.length || 0} records</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("medications")}
                    >
                      <Activity size={24} />
                      <h4>Prescriptions</h4>
                      <p>{allMedications?.length || 0} prescriptions</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("treatments")}
                    >
                      <Activity size={24} />
                      <h4>Treatments</h4>
                      <p>{allTreatments?.length || 0} treatments</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("soap-notes")}
                    >
                      <FileText size={24} />
                      <h4>Patient's SOAP Notes</h4>
                      <p>{soapNotes?.length || 0} notes</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("documents")}
                    >
                      <FileText size={24} />
                      <h4>Documents</h4>
                      <p>{medicalHistory.documents?.length || 0} files</p>
                      {viewMode === "vet" && !isReadOnly && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal("documents");
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("vaccinations")}
                    >
                      <Activity size={24} />
                      <h4>Vaccinations</h4>
                      <p>{medicalHistory.vaccinations?.length || 0} vaccines</p>
                      {viewMode === "vet" && !isReadOnly && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal("vaccinations");
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("conditions")}
                    >
                      <Activity size={24} />
                      <h4>Conditions</h4>
                      <p>{medicalHistory.conditions?.length || 0} conditions</p>
                      {viewMode === "vet" && !isReadOnly && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal("conditions");
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveHealthView("surgeries")}
                    >
                      <Activity size={24} />
                      <h4>Surgeries</h4>
                      <p>{medicalHistory?.surgeries?.length || 0} surgeries</p>
                      {viewMode === "vet" && !isReadOnly && (
                        <button
                          className="btn-add-card"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddRecordModal("surgeries");
                          }}
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="detailed-view">
                    <button
                      className="back-to-dashboard"
                      onClick={() => setActiveHealthView(null)}
                    >
                      ← Back to Dashboard
                    </button>

                    {/* Examinations View */}
                    {activeHealthView === "examinations" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3>Examinations & Treatment History</h3>
                          {editMode && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={handleExitEditMode}
                                className="btn-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveExamChanges}
                                className="btn-save-edit"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                        {examinations.length === 0 ? (
                          <p className="no-data">
                            No examinations or treatments recorded yet.
                          </p>
                        ) : (
                          <div className="examinations-list">
                            {examinations.map((exam) => {
                              const currentExam =
                                editMode &&
                                editingExam?.appt_id === exam.appt_id
                                  ? editingExam
                                  : exam;
                              const isThisExamEditing =
                                editMode &&
                                editingExam?.appt_id === exam.appt_id;

                              return (
                                <div
                                  key={exam.appt_id}
                                  className="examination-card"
                                >
                                  <div
                                    className="exam-header"
                                    onClick={() =>
                                      !editMode &&
                                      setExpandedExam(
                                        expandedExam === exam.appt_id
                                          ? null
                                          : exam.appt_id
                                      )
                                    }
                                  >
                                    <div className="exam-header-left">
                                      {isThisExamEditing ? (
                                        <input
                                          type="text"
                                          value={currentExam.appt_type}
                                          onChange={(e) =>
                                            handleEditChange(
                                              "appt_type",
                                              e.target.value
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "4px",
                                            border: "1px solid #cbd5e1",
                                          }}
                                        />
                                      ) : (
                                        <span
                                          className={`exam-type exam-${exam.appt_type
                                            .toLowerCase()
                                            .replace(/\s*&\s*/g, "-")
                                            .replace(/\s+/g, "-")}`}
                                        >
                                          {exam.appt_type}
                                        </span>
                                      )}
                                      <span className="exam-date">
                                        {new Date(
                                          exam.appt_date
                                        ).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                      {isThisExamEditing ? (
                                        <select
                                          value={currentExam.appt_status}
                                          onChange={(e) =>
                                            handleEditChange(
                                              "appt_status",
                                              e.target.value
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "4px",
                                            border: "1px solid #cbd5e1",
                                          }}
                                        >
                                          <option value="scheduled">
                                            Scheduled
                                          </option>
                                          <option value="completed">
                                            Completed
                                          </option>
                                          <option value="cancelled">
                                            Cancelled
                                          </option>
                                        </select>
                                      ) : (
                                        <span
                                          className={`exam-status ${exam.appt_status}`}
                                        >
                                          {exam.appt_status}
                                        </span>
                                      )}
                                    </div>
                                    {!editMode && (
                                      <ChevronDown
                                        size={20}
                                        className={`expand-icon ${
                                          expandedExam === exam.appt_id
                                            ? "expanded"
                                            : ""
                                        }`}
                                      />
                                    )}
                                  </div>

                                  <div className="exam-summary">
                                    <p>
                                      <strong>Vet:</strong> {exam.vet_name}
                                    </p>
                                    <p>
                                      <strong>Clinic:</strong>{" "}
                                      {exam.clinic_name}
                                    </p>
                                    <p>
                                      <strong>Type:</strong>{" "}
                                      {exam.consultation_type}
                                    </p>
                                    {isThisExamEditing ? (
                                      <div>
                                        <strong>Description:</strong>
                                        <textarea
                                          value={
                                            currentExam.appt_description || ""
                                          }
                                          onChange={(e) =>
                                            handleEditChange(
                                              "appt_description",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            marginTop: "0.25rem",
                                            borderRadius: "4px",
                                            border: "1px solid #cbd5e1",
                                          }}
                                          rows="2"
                                        />
                                      </div>
                                    ) : (
                                      exam.appt_description && (
                                        <p>
                                          <strong>Description:</strong>{" "}
                                          {exam.appt_description}
                                        </p>
                                      )
                                    )}
                                  </div>

                                  {(expandedExam === exam.appt_id ||
                                    isThisExamEditing) && (
                                    <div className="exam-details">
                                      {viewMode === "vet" && !editMode && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            marginBottom: "1rem",
                                          }}
                                        >
                                          <button
                                            onClick={() =>
                                              handleEnterEditMode(exam)
                                            }
                                            className="btn-edit-record"
                                          >
                                            Edit Record
                                          </button>
                                        </div>
                                      )}

                                      {/* Treatments Section */}
                                      <div className="treatments-section">
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "1rem",
                                          }}
                                        >
                                          <h4>Treatments Administered</h4>
                                          {!editMode && viewMode === "vet" && (
                                            <button
                                              className="btn-add-treatment"
                                              onClick={() =>
                                                handleOpenAddTreatmentModal(
                                                  exam.appt_id
                                                )
                                              }
                                            >
                                              <Plus size={16} /> Add Treatment
                                            </button>
                                          )}
                                        </div>

                                        {currentExam.treatments &&
                                        currentExam.treatments.length > 0 ? (
                                          <table className="data-table">
                                            <thead>
                                              <tr>
                                                <th>Type</th>
                                                <th>Dose</th>
                                                <th>Frequency</th>
                                                <th>Duration</th>
                                                <th>Notes</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {currentExam.treatments.map(
                                                (treatment, idx) => (
                                                  <tr key={idx}>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={treatment.type}
                                                          onChange={(e) =>
                                                            handleEditTreatment(
                                                              idx,
                                                              "type",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        treatment.type
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={treatment.dose}
                                                          onChange={(e) =>
                                                            handleEditTreatment(
                                                              idx,
                                                              "dose",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        treatment.dose
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={
                                                            treatment.frequency
                                                          }
                                                          onChange={(e) =>
                                                            handleEditTreatment(
                                                              idx,
                                                              "frequency",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        treatment.frequency
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={
                                                            treatment.duration
                                                          }
                                                          onChange={(e) =>
                                                            handleEditTreatment(
                                                              idx,
                                                              "duration",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        treatment.duration
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={
                                                            treatment.notes ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            handleEditTreatment(
                                                              idx,
                                                              "notes",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        treatment.notes
                                                      )}
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        ) : (
                                          <p className="no-data">
                                            No treatments recorded for this
                                            examination.
                                          </p>
                                        )}
                                      </div>

                                      {/* Prescriptions Section */}
                                      <div
                                        className="prescriptions-section"
                                        style={{ marginTop: "2rem" }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "1rem",
                                          }}
                                        >
                                          <h4>Prescriptions</h4>
                                          {!editMode && viewMode === "vet" && (
                                            <button
                                              className="btn-add-prescription"
                                              onClick={() =>
                                                handleOpenAddPrescriptionModal(
                                                  exam.appt_id
                                                )
                                              }
                                            >
                                              <Plus size={16} /> Add
                                              Prescription
                                            </button>
                                          )}
                                        </div>

                                        {currentExam.prescriptions &&
                                        currentExam.prescriptions.length > 0 ? (
                                          <table className="data-table">
                                            <thead>
                                              <tr>
                                                <th>Medication</th>
                                                <th>Dose</th>
                                                <th>Frequency</th>
                                                <th>Duration</th>
                                                <th>Instructions</th>
                                                <th>Period</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {currentExam.prescriptions.map(
                                                (rx, idx) => (
                                                  <tr key={idx}>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={rx.medication}
                                                          onChange={(e) =>
                                                            handleEditPrescription(
                                                              idx,
                                                              "medication",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        rx.medication
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={rx.dose}
                                                          onChange={(e) =>
                                                            handleEditPrescription(
                                                              idx,
                                                              "dose",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        rx.dose
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={rx.frequency}
                                                          onChange={(e) =>
                                                            handleEditPrescription(
                                                              idx,
                                                              "frequency",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        rx.frequency
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={rx.duration}
                                                          onChange={(e) =>
                                                            handleEditPrescription(
                                                              idx,
                                                              "duration",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        rx.duration
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <input
                                                          type="text"
                                                          value={
                                                            rx.instructions ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            handleEditPrescription(
                                                              idx,
                                                              "instructions",
                                                              e.target.value
                                                            )
                                                          }
                                                          style={{
                                                            width: "100%",
                                                            padding: "0.25rem",
                                                            border:
                                                              "1px solid #cbd5e1",
                                                            borderRadius: "4px",
                                                          }}
                                                        />
                                                      ) : (
                                                        rx.instructions
                                                      )}
                                                    </td>
                                                    <td>
                                                      {isThisExamEditing ? (
                                                        <div
                                                          style={{
                                                            display: "flex",
                                                            gap: "0.25rem",
                                                            flexDirection:
                                                              "column",
                                                          }}
                                                        >
                                                          <input
                                                            type="date"
                                                            value={
                                                              rx.start_date
                                                            }
                                                            onChange={(e) =>
                                                              handleEditPrescription(
                                                                idx,
                                                                "start_date",
                                                                e.target.value
                                                              )
                                                            }
                                                            style={{
                                                              width: "100%",
                                                              padding:
                                                                "0.25rem",
                                                              border:
                                                                "1px solid #cbd5e1",
                                                              borderRadius:
                                                                "4px",
                                                            }}
                                                          />
                                                          <input
                                                            type="date"
                                                            value={
                                                              rx.end_date || ""
                                                            }
                                                            onChange={(e) =>
                                                              handleEditPrescription(
                                                                idx,
                                                                "end_date",
                                                                e.target.value
                                                              )
                                                            }
                                                            style={{
                                                              width: "100%",
                                                              padding:
                                                                "0.25rem",
                                                              border:
                                                                "1px solid #cbd5e1",
                                                              borderRadius:
                                                                "4px",
                                                            }}
                                                          />
                                                        </div>
                                                      ) : (
                                                        `${rx.start_date} ${
                                                          rx.end_date
                                                            ? `to ${rx.end_date}`
                                                            : "(Ongoing)"
                                                        }`
                                                      )}
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        ) : (
                                          <p className="no-data">
                                            No prescriptions recorded for this
                                            examination.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Medications View */}
                    {activeHealthView === "medications" && (
                      <>
                        <h3>All Medications & Prescriptions</h3>
                        {allMedications.length === 0 ? (
                          <p className="no-data">
                            No medications or prescriptions recorded.
                          </p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Medication</th>
                                <th>Dose</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allMedications.map((med, idx) => {
                                const isActive =
                                  !med.end_date ||
                                  new Date(med.end_date) >= new Date();
                                return (
                                  <tr key={idx}>
                                    <td>{med.medication}</td>
                                    <td>{med.dose}</td>
                                    <td>{med.frequency}</td>
                                    <td>{med.duration}</td>
                                    <td>{med.instructions || "N/A"}</td>
                                    <td>
                                      {med.start_date
                                        ? new Date(
                                            med.start_date
                                          ).toLocaleDateString("en-GB")
                                        : "N/A"}
                                    </td>
                                    <td>
                                      {med.end_date
                                        ? new Date(
                                            med.end_date
                                          ).toLocaleDateString("en-GB")
                                        : "Ongoing"}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          isActive ? "active" : "resolved"
                                        }`}
                                      >
                                        {isActive ? "Active" : "Completed"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Treatments View */}
                    {activeHealthView === "treatments" && (
                      <>
                        <h3>All Treatments Administered</h3>
                        {allTreatments.length === 0 ? (
                          <p className="no-data">No treatments recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Dose</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allTreatments.map((treatment, idx) => (
                                <tr key={idx}>
                                  <td>
                                    {treatment.admin_date
                                      ? new Date(
                                          treatment.admin_date
                                        ).toLocaleDateString("en-GB")
                                      : "N/A"}
                                  </td>
                                  <td>{treatment.type}</td>
                                  <td>{treatment.dose}</td>
                                  <td>{treatment.frequency || "N/A"}</td>
                                  <td>{treatment.duration || "N/A"}</td>
                                  <td>{treatment.notes || "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Documents View */}
                    {activeHealthView === "documents" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3>Documents & Attachments</h3>
                          {editingRecordType === "documents" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() =>
                                  handleDeleteRecord(
                                    editingRecord.doc_id,
                                    "documents"
                                  )
                                }
                                className="btn-delete-edit"
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={handleExitRecordEditMode}
                                className="btn-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveRecordChanges}
                                className="btn-save-edit"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                        {medicalHistory.documents.length === 0 ? (
                          <p className="no-data">No documents uploaded.</p>
                        ) : (
                          <div className="documents-grid">
                            {medicalHistory.documents.map((doc) => {
                              const isEditing =
                                editingRecord?.doc_id === doc.id &&
                                editingRecordType === "documents";
                              const currentDoc = isEditing
                                ? editingRecord
                                : doc;

                              return (
                                <div
                                  key={doc.id}
                                  className="document-card"
                                  style={{
                                    position: "relative",
                                    cursor: isEditing ? "default" : "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                  onClick={() =>
                                    !isEditing &&
                                    handleViewDocumentModal(
                                      doc.file_url,
                                      doc.title
                                    )
                                  }
                                >
                                  <div className="doc-icon">
                                    {currentDoc.type === "xray" ? (
                                      <Activity size={24} color="#4f46e5" />
                                    ) : currentDoc.type === "lab" ? (
                                      <FileText size={24} color="#059669" />
                                    ) : (
                                      <FileText size={24} color="#64748b" />
                                    )}
                                  </div>
                                  <div className="doc-info">
                                    {isEditing ? (
                                      <>
                                        <input
                                          type="text"
                                          value={currentDoc.title}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "title",
                                              e.target.value
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            marginBottom: "0.5rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                        <select
                                          value={currentDoc.type}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "type",
                                              e.target.value
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            marginBottom: "0.5rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <option value="report">Report</option>
                                          <option value="xray">X-Ray</option>
                                          <option value="lab">
                                            Lab Result
                                          </option>
                                          <option value="rx">
                                            Prescription
                                          </option>
                                          <option value="photo">Photo</option>
                                          <option value="other">Other</option>
                                        </select>
                                        <input
                                          type="text"
                                          value={currentDoc.file_url || ""}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "file_url",
                                              e.target.value
                                            )
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          placeholder="File URL"
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <strong>{doc.title}</strong>
                                        <span className="doc-date">
                                          {new Date(
                                            doc.date
                                          ).toLocaleDateString("en-GB")}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {!isEditing && (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        marginTop: "0.75rem",
                                        width: "100%",
                                      }}
                                    >
                                      <button
                                        className="doc-download"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadDocument(
                                            doc.file_url,
                                            doc.title
                                          );
                                        }}
                                        style={{
                                          background:
                                            "linear-gradient(135deg, #a8e6cf 0%, #98ddc0 100%)",
                                          color: "#065f46",
                                          flex: 1,
                                        }}
                                      >
                                        Download
                                      </button>
                                      {viewMode === "vet" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEnterRecordEditMode(
                                              { ...doc, doc_id: doc.id },
                                              "documents"
                                            );
                                          }}
                                          className="doc-download"
                                          style={{
                                            background:
                                              "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                                            color: "#92400e",
                                            flex: 1,
                                          }}
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Vaccinations View */}
                    {activeHealthView === "vaccinations" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3>Vaccination History</h3>
                          {editingRecordType === "vaccinations" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() =>
                                  handleDeleteRecord(
                                    editingRecord.vac_id,
                                    "vaccinations"
                                  )
                                }
                                className="btn-delete-edit"
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={handleExitRecordEditMode}
                                className="btn-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveRecordChanges}
                                className="btn-save-edit"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                        {medicalHistory.vaccinations.length === 0 ? (
                          <p className="no-data">No vaccinations recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Vaccine</th>
                                <th>Last Given</th>
                                <th>Next Due</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                                {viewMode === "vet" && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.vaccinations.map((vac, idx) => {
                                const isEditing =
                                  editingRecord?.vac_id === vac.vac_id &&
                                  editingRecordType === "vaccinations";
                                const currentVac = isEditing
                                  ? editingRecord
                                  : vac;

                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      new Date(vac.next_date) < new Date()
                                        ? "overdue"
                                        : ""
                                    }
                                  >
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={currentVac.vaccine}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "vaccine",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        vac.vaccine
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={currentVac.vac_date}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "vac_date",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        new Date(
                                          vac.vac_date
                                        ).toLocaleDateString("en-GB")
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={currentVac.next_date}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "next_date",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.25rem",
                                          }}
                                        >
                                          <span>
                                            {new Date(
                                              vac.next_date
                                            ).toLocaleDateString("en-GB")}
                                          </span>
                                          {new Date(vac.next_date) <
                                            new Date() && (
                                            <span className="badge overdue-badge">
                                              Overdue
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td>{vac.vet}</td>
                                    <td>
                                      {isEditing ? (
                                        <textarea
                                          value={currentVac.notes || ""}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "notes",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                          rows="2"
                                        />
                                      ) : (
                                        vac.notes
                                      )}
                                    </td>
                                    {viewMode === "vet" && (
                                      <td>
                                        {!editingRecordType && (
                                          <button
                                            onClick={() =>
                                              handleEnterRecordEditMode(
                                                vac,
                                                "vaccinations"
                                              )
                                            }
                                            className="btn-edit-inline"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Conditions View */}
                    {activeHealthView === "conditions" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3>Chronic Conditions & Diagnoses</h3>
                          {editingRecordType === "conditions" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() =>
                                  handleDeleteRecord(
                                    editingRecord.cond_id,
                                    "conditions"
                                  )
                                }
                                className="btn-delete-edit"
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={handleExitRecordEditMode}
                                className="btn-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveRecordChanges}
                                className="btn-save-edit"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                        {medicalHistory.conditions.length === 0 ? (
                          <p className="no-data">
                            No chronic conditions recorded.
                          </p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Condition</th>
                                <th>Diagnosed</th>
                                <th>Status</th>
                                <th>Notes</th>
                                {viewMode === "vet" && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.conditions.map((cond, idx) => {
                                const isEditing =
                                  editingRecord?.cond_id === cond.cond_id &&
                                  editingRecordType === "conditions";
                                const currentCond = isEditing
                                  ? editingRecord
                                  : cond;

                                return (
                                  <tr key={idx}>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={currentCond.condition}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "condition",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        cond.condition
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={currentCond.diag_date}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "diag_date",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        new Date(
                                          cond.diag_date
                                        ).toLocaleDateString("en-GB")
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <select
                                          value={currentCond.status}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "status",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <option value="active">Active</option>
                                          <option value="resolved">
                                            Resolved
                                          </option>
                                        </select>
                                      ) : (
                                        <span
                                          className={`badge ${cond.status}`}
                                        >
                                          {cond.status}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <textarea
                                          value={currentCond.notes || ""}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "notes",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                          rows="2"
                                        />
                                      ) : (
                                        cond.notes
                                      )}
                                    </td>
                                    {viewMode === "vet" && (
                                      <td>
                                        {!editingRecordType && (
                                          <button
                                            onClick={() =>
                                              handleEnterRecordEditMode(
                                                cond,
                                                "conditions"
                                              )
                                            }
                                            className="btn-edit-inline"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* Surgeries View */}
                    {activeHealthView === "surgeries" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <h3>Surgical History</h3>
                          {editingRecordType === "surgeries" && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() =>
                                  handleDeleteRecord(
                                    editingRecord.surg_id,
                                    "surgeries"
                                  )
                                }
                                className="btn-delete-edit"
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={handleExitRecordEditMode}
                                className="btn-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveRecordChanges}
                                className="btn-save-edit"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                        {!medicalHistory.surgeries ||
                        medicalHistory.surgeries.length === 0 ? (
                          <p className="no-data">No surgeries recorded.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Surgery</th>
                                <th>Date</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                                <th>Complications</th>
                                {viewMode === "vet" && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.surgeries.map((surg, idx) => {
                                const isEditing =
                                  editingRecord?.surg_id === surg.surg_id &&
                                  editingRecordType === "surgeries";
                                const currentSurg = isEditing
                                  ? editingRecord
                                  : surg;

                                return (
                                  <tr key={idx}>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={currentSurg.name}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "name",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        surg.name
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={currentSurg.date}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "date",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        new Date(surg.date).toLocaleDateString(
                                          "en-GB"
                                        )
                                      )}
                                    </td>
                                    <td>{surg.vet || "N/A"}</td>
                                    <td>
                                      {isEditing ? (
                                        <textarea
                                          value={currentSurg.notes || ""}
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "notes",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                          rows="2"
                                        />
                                      ) : (
                                        surg.notes || "N/A"
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <textarea
                                          value={
                                            currentSurg.complications || ""
                                          }
                                          onChange={(e) =>
                                            handleRecordEditChange(
                                              "complications",
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "0.25rem",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                          rows="2"
                                        />
                                      ) : (
                                        surg.complications || "None"
                                      )}
                                    </td>
                                    {viewMode === "vet" && (
                                      <td>
                                        {!editingRecordType && (
                                          <button
                                            onClick={() =>
                                              handleEnterRecordEditMode(
                                                surg,
                                                "surgeries"
                                              )
                                            }
                                            className="btn-edit-inline"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    )}

                    {/* SOAP Notes View */}
                    {activeHealthView === "soap-notes" && (
                      <>
                        <h3>Patient's SOAP Notes</h3>
                        {soapNotes.length === 0 ? (
                          <p className="no-data">No SOAP notes recorded.</p>
                        ) : (
                          <div className="soap-notes-list">
                            {soapNotes.map((note, idx) => (
                              <div
                                key={idx}
                                className="soap-note-card"
                                style={{
                                  background: "white",
                                  border: "2px solid #e8f0f7",
                                  borderRadius: "12px",
                                  padding: "1.5rem",
                                  marginBottom: "1rem",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "1rem",
                                    paddingBottom: "0.75rem",
                                    borderBottom: "2px solid #e8f0f7",
                                  }}
                                >
                                  <h4 style={{ margin: 0, color: "#1a2e35" }}>
                                    {new Date(
                                      note.soap_date
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </h4>
                                </div>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                  {note.subj && (
                                    <div>
                                      <strong
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        Subjective:
                                      </strong>
                                      <p style={{ margin: "0.25rem 0 0 0" }}>
                                        {note.subj}
                                      </p>
                                    </div>
                                  )}
                                  {note.obj && (
                                    <div>
                                      <strong
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        Objective:
                                      </strong>
                                      <p style={{ margin: "0.25rem 0 0 0" }}>
                                        {note.obj}
                                      </p>
                                    </div>
                                  )}
                                  {note.assess && (
                                    <div>
                                      <strong
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        Assessment:
                                      </strong>
                                      <p style={{ margin: "0.25rem 0 0 0" }}>
                                        {note.assess}
                                      </p>
                                    </div>
                                  )}
                                  {note.plan && (
                                    <div>
                                      <strong
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        Plan:
                                      </strong>
                                      <p style={{ margin: "0.25rem 0 0 0" }}>
                                        {note.plan}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tracking Tab */}
            {activeHealthTab === "tracking" && (
              <div className="tracking-section">
                {!activeTrackingView ? (
                  <div className="health-dashboard-grid">
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveTrackingView("weight")}
                    >
                      <Scale size={24} />
                      <h4>Weight Tracking</h4>
                      <p>{trackingData.weightLog?.length || 0} entries</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveTrackingView("activity")}
                    >
                      <Activity size={24} />
                      <h4>Activity Log</h4>
                      <p>{trackingData.activityLog?.length || 0} activities</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveTrackingView("symptoms")}
                    >
                      <FileText size={24} />
                      <h4>Symptoms</h4>
                      <p>{trackingData.symptomLog?.length || 0} logs</p>
                    </div>
                    <div
                      className="health-card clickable"
                      onClick={() => setActiveTrackingView("behavior")}
                    >
                      <Activity size={24} />
                      <h4>Behavior</h4>
                      <p>{trackingData.behaviorLog?.length || 0} notes</p>
                    </div>
                  </div>
                ) : (
                  <div className="detailed-view">
                    <button
                      className="back-to-dashboard"
                      onClick={() => setActiveTrackingView(null)}
                    >
                      ← Back to Dashboard
                    </button>

                    {/* Weight Tracking Full View */}
                    {activeTrackingView === "weight" && (
                      <>
                        <div className="tracking-header">
                          <h3>Weight Tracking - All Entries</h3>
                          <button
                            className="btn-add-section"
                            onClick={() => handleOpenTrackingModal("weight")}
                          >
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                        <div className="weight-chart">
                          {trackingData.weightLog.map((log, idx) => (
                            <div key={idx} className="weight-entry">
                              <span className="weight-value">
                                {log.weight} kg
                              </span>
                              <span className="weight-date">
                                {new Date(log.rec_date).toLocaleDateString(
                                  "en-GB"
                                )}
                              </span>
                              {log.notes && (
                                <span className="weight-notes">
                                  {log.notes}
                                </span>
                              )}
                            </div>
                          ))}
                          {trackingData.weightLog.length === 0 && (
                            <p className="no-data">No weight entries yet</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Activity Log Full View */}
                    {activeTrackingView === "activity" && (
                      <>
                        <div className="tracking-header">
                          <h3>Activity Log - All Entries</h3>
                          <button
                            className="btn-add-section"
                            onClick={() => handleOpenTrackingModal("activity")}
                          >
                            <Plus size={16} /> Add Activity
                          </button>
                        </div>
                        <div className="activity-list">
                          {trackingData.activityLog.map((activity, idx) => (
                            <div key={idx} className="activity-entry">
                              <span className="activity-type">
                                {activity.activ_type}
                              </span>
                              <span className="activity-duration">
                                {activity.duration_min} mins
                              </span>
                              <span className="activity-date">
                                {new Date(
                                  activity.activ_date
                                ).toLocaleDateString("en-GB")}
                              </span>
                              {activity.notes && (
                                <span className="activity-notes">
                                  {activity.notes}
                                </span>
                              )}
                            </div>
                          ))}
                          {trackingData.activityLog.length === 0 && (
                            <p className="no-data">
                              No activities logged yet. Click "Add Activity" to
                              start tracking.
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Symptom Diary Full View */}
                    {activeTrackingView === "symptoms" && (
                      <>
                        <div className="tracking-header">
                          <h3>Symptom Diary - All Entries</h3>
                          <button
                            className="btn-add-section"
                            onClick={() => handleOpenTrackingModal("symptoms")}
                          >
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                        <div className="symptom-list">
                          {trackingData.symptomLog.map((symptom, idx) => (
                            <div key={idx} className="symptom-entry">
                              <div className="symptom-header">
                                <span className="symptom-title">
                                  {symptom.symp_title}
                                </span>
                                <span className="symptom-date">
                                  {new Date(
                                    symptom.symp_date
                                  ).toLocaleDateString("en-GB")}
                                </span>
                              </div>
                              <p className="symptom-description">
                                {symptom.symp_desc}
                              </p>
                            </div>
                          ))}
                          {trackingData.symptomLog.length === 0 && (
                            <p className="no-data">
                              No symptoms recorded yet. Click "Add Entry" to
                              start tracking.
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Behavioral Notes Full View */}
                    {activeTrackingView === "behavior" && (
                      <>
                        <div className="tracking-header">
                          <h3>Behavioral Notes - All Entries</h3>
                          <button
                            className="btn-add-section"
                            onClick={() => handleOpenTrackingModal("behavior")}
                          >
                            <Plus size={16} /> Add Note
                          </button>
                        </div>
                        <div className="behavior-list">
                          {trackingData.behaviorLog.map((behavior, idx) => (
                            <div key={idx} className="behavior-entry">
                              <span className="behavior-type">
                                {behavior.behav_type}
                              </span>
                              <span className="behavior-note">
                                {behavior.behav_note}
                              </span>
                              <span className="behavior-date">
                                {new Date(
                                  behavior.behav_date
                                ).toLocaleDateString("en-GB")}
                              </span>
                            </div>
                          ))}
                          {trackingData.behaviorLog.length === 0 && (
                            <p className="no-data">
                              No behavioral notes yet. Click "Add Note" to start
                              tracking.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Entry Modal */}
      {showTrackingModal && (
        <div
          className="mypatients-modal-overlay"
          onClick={handleCloseTrackingModal}
        >
          <div
            className="mypatients-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">
                {trackingModalType === "weight" && "Add Weight Entry"}
                {trackingModalType === "activity" && "Add Activity Entry"}
                {trackingModalType === "symptoms" && "Add Symptom Entry"}
                {trackingModalType === "behavior" && "Add Behavioral Note"}
              </h2>
              <button
                className="mypatients-modal-close"
                onClick={handleCloseTrackingModal}
              >
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              {/* Weight Entry Form */}
              {trackingModalType === "weight" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.date}
                      onChange={(e) =>
                        handleTrackingInputChange("date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="0.0"
                      value={newTrackingEntry.weight}
                      onChange={(e) =>
                        handleTrackingInputChange("weight", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., After meal, morning weigh-in..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) =>
                        handleTrackingInputChange("notes", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Activity Entry Form */}
              {trackingModalType === "activity" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.date}
                      onChange={(e) =>
                        handleTrackingInputChange("date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Activity Type *
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.activityType}
                      onChange={(e) =>
                        handleTrackingInputChange(
                          "activityType",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select activity type</option>
                      <option value="Walk">Walk</option>
                      <option value="Run">Run</option>
                      <option value="Playtime">Playtime</option>
                      <option value="Training">Training</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="0"
                      value={newTrackingEntry.duration}
                      onChange={(e) =>
                        handleTrackingInputChange("duration", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., High energy, enjoyed the activity..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) =>
                        handleTrackingInputChange("notes", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Symptom Entry Form */}
              {trackingModalType === "symptoms" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.date}
                      onChange={(e) =>
                        handleTrackingInputChange("date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Symptom Title *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., Vomiting, Limping, Loss of appetite..."
                      value={newTrackingEntry.symptomTitle}
                      onChange={(e) =>
                        handleTrackingInputChange(
                          "symptomTitle",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Description *
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="Describe the symptom in detail..."
                      rows="4"
                      value={newTrackingEntry.symptomDescription}
                      onChange={(e) =>
                        handleTrackingInputChange(
                          "symptomDescription",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </>
              )}

              {/* Behavioral Note Form */}
              {trackingModalType === "behavior" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.date}
                      onChange={(e) =>
                        handleTrackingInputChange("date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Behavior Type *
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      value={newTrackingEntry.behaviorType}
                      onChange={(e) =>
                        handleTrackingInputChange(
                          "behaviorType",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select behavior type</option>
                      <option value="Positive">Positive</option>
                      <option value="Normal">Normal</option>
                      <option value="Anxiety">Anxiety</option>
                      <option value="Aggression">Aggression</option>
                      <option value="Alert">Alert</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Behavioral Note *
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      placeholder="Describe the behavior..."
                      rows="4"
                      value={newTrackingEntry.behaviorNote}
                      onChange={(e) =>
                        handleTrackingInputChange(
                          "behaviorNote",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={handleCloseTrackingModal}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTrackingEntry}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Health Record Modal */}
      {showAddRecordModal && (
        <div
          className="mypatients-modal-overlay"
          onClick={handleCloseAddRecordModal}
        >
          <div
            className="mypatients-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">
                {addRecordType === "vaccinations" && "Add Vaccination Record"}
                {addRecordType === "documents" && "Add Document"}
                {addRecordType === "conditions" && "Add Condition"}
                {addRecordType === "surgeries" && "Add Surgery Record"}
              </h2>
              <button
                className="mypatients-modal-close"
                onClick={handleCloseAddRecordModal}
              >
                <X size={24} />
              </button>
            </div>

            <div className="view-modal-body">
              {/* Vaccination Form */}
              {addRecordType === "vaccinations" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Vaccine Name *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., Rabies, DHPP, Bordetella..."
                      value={newRecordData.vac_name}
                      onChange={(e) =>
                        handleRecordInputChange("vac_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Date Given *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.vac_date}
                      onChange={(e) =>
                        handleRecordInputChange("vac_date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.next_date}
                      onChange={(e) =>
                        handleRecordInputChange("next_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="Any additional notes..."
                      rows="3"
                      value={newRecordData.vac_notes}
                      onChange={(e) =>
                        handleRecordInputChange("vac_notes", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Document Form */}
              {addRecordType === "documents" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Document Title *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., Blood Test Results, X-Ray..."
                      value={newRecordData.doc_title}
                      onChange={(e) =>
                        handleRecordInputChange("doc_title", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Document Type *
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.doc_type}
                      onChange={(e) =>
                        handleRecordInputChange("doc_type", e.target.value)
                      }
                      required
                    >
                      <option value="report">Report</option>
                      <option value="xray">X-Ray</option>
                      <option value="lab">Lab Result</option>
                      <option value="rx">Prescription</option>
                      <option value="photo">Photo</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Upload Document *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                        cursor: "pointer",
                      }}
                    />
                    {selectedFile && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#059669",
                          marginTop: "-0.5rem",
                          marginBottom: "1rem",
                        }}
                      >
                        ✓ Selected: {selectedFile.name}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        marginTop: "-0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      Accepted formats: Images (JPG, PNG, GIF), PDF, Word
                      documents. Max size: 10MB
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      margin: "1rem 0",
                      color: "#64748b",
                      fontSize: "0.875rem",
                    }}
                  >
                    <hr
                      style={{
                        flex: 1,
                        border: "none",
                        borderTop: "1px solid #e8f0f7",
                      }}
                    />
                    <span>OR</span>
                    <hr
                      style={{
                        flex: 1,
                        border: "none",
                        borderTop: "1px solid #e8f0f7",
                      }}
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      File URL (Optional)
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="https://..."
                      value={newRecordData.file_url}
                      onChange={(e) =>
                        handleRecordInputChange("file_url", e.target.value)
                      }
                      disabled={selectedFile !== null}
                    />
                    {selectedFile && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#64748b",
                          marginTop: "-0.5rem",
                        }}
                      >
                        URL input disabled when file is selected
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Condition Form */}
              {addRecordType === "conditions" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Condition Name *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., Diabetes, Arthritis, Heart Disease..."
                      value={newRecordData.cond_name}
                      onChange={(e) =>
                        handleRecordInputChange("cond_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Diagnosis Date
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.diag_date}
                      onChange={(e) =>
                        handleRecordInputChange("diag_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Status *
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.status}
                      onChange={(e) =>
                        handleRecordInputChange("status", e.target.value)
                      }
                      required
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="Treatment plan, management notes..."
                      rows="3"
                      value={newRecordData.cond_notes}
                      onChange={(e) =>
                        handleRecordInputChange("cond_notes", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Surgery Form */}
              {addRecordType === "surgeries" && (
                <>
                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Surgery Name *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="E.g., Spay/Neuter, Tumor Removal..."
                      value={newRecordData.surg_name}
                      onChange={(e) =>
                        handleRecordInputChange("surg_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Surgery Date *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      value={newRecordData.surg_date}
                      onChange={(e) =>
                        handleRecordInputChange("surg_date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Surgery Notes
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="Procedure details..."
                      rows="3"
                      value={newRecordData.surg_notes}
                      onChange={(e) =>
                        handleRecordInputChange("surg_notes", e.target.value)
                      }
                    />
                  </div>

                  <div className="view-section">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Complications (if any)
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        border: "2px solid #e8f0f7",
                        borderRadius: "12px",
                        marginBottom: "1rem",
                      }}
                      placeholder="None / Describe any complications..."
                      rows="2"
                      value={newRecordData.complications}
                      onChange={(e) =>
                        handleRecordInputChange("complications", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={handleCloseAddRecordModal}
                  className="mypatients-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRecord}
                  className="mypatients-submit-button"
                  disabled={uploadingFile}
                  style={{
                    opacity: uploadingFile ? 0.6 : 1,
                    cursor: uploadingFile ? "not-allowed" : "pointer",
                  }}
                >
                  {uploadingFile ? "Uploading..." : "Save Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {showAddTreatmentModal && (
        <div
          className="mypatients-modal-overlay"
          onClick={() => setShowAddTreatmentModal(false)}
        >
          <div
            className="mypatients-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Add Treatment</h2>
              <button
                className="mypatients-modal-close"
                onClick={() => setShowAddTreatmentModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="view-modal-body">
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Treatment Type *
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., IV Fluids, Antibiotics..."
                  value={newTreatment.type}
                  onChange={(e) =>
                    setNewTreatment({ ...newTreatment, type: e.target.value })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Dose *
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., 500mg, 10ml..."
                  value={newTreatment.dose}
                  onChange={(e) =>
                    setNewTreatment({ ...newTreatment, dose: e.target.value })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Frequency
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., Once daily, Twice daily..."
                  value={newTreatment.frequency}
                  onChange={(e) =>
                    setNewTreatment({
                      ...newTreatment,
                      frequency: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Duration
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., 7 days, 2 weeks..."
                  value={newTreatment.duration}
                  onChange={(e) =>
                    setNewTreatment({
                      ...newTreatment,
                      duration: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Notes
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  rows="3"
                  value={newTreatment.notes}
                  onChange={(e) =>
                    setNewTreatment({ ...newTreatment, notes: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={() => setShowAddTreatmentModal(false)}
                  className="mypatients-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTreatment}
                  className="mypatients-submit-button"
                >
                  Save Treatment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showAddPrescriptionModal && (
        <div
          className="mypatients-modal-overlay"
          onClick={() => setShowAddPrescriptionModal(false)}
        >
          <div
            className="mypatients-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Add Prescription</h2>
              <button
                className="mypatients-modal-close"
                onClick={() => setShowAddPrescriptionModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="view-modal-body">
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Medication Name *
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., Amoxicillin, Carprofen..."
                  value={newPrescription.medication}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      medication: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Dose *
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., 250mg, 5ml..."
                  value={newPrescription.dose}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      dose: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Frequency *
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., Twice daily, Every 8 hours..."
                  value={newPrescription.frequency}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      frequency: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Duration
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  placeholder="E.g., 10 days, 2 weeks..."
                  value={newPrescription.duration}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      duration: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Instructions
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  rows="3"
                  placeholder="E.g., Give with food, avoid dairy..."
                  value={newPrescription.instructions}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      instructions: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  value={newPrescription.start_date}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="view-section">
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    border: "2px solid #e8f0f7",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                  }}
                  value={newPrescription.end_date}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  onClick={() => setShowAddPrescriptionModal(false)}
                  className="mypatients-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPrescription}
                  className="mypatients-submit-button"
                >
                  Save Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Changes Confirmation Modal */}
      {showDiscardModal && (
        <div
          className="mypatients-modal-overlay"
          onClick={() => setShowDiscardModal(false)}
        >
          <div
            className="mypatients-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <div className="mypatients-modal-header">
              <h2 className="mypatients-modal-title">Discard Changes?</h2>
              <button
                className="mypatients-modal-close"
                onClick={() => setShowDiscardModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="view-modal-body">
              <p style={{ marginBottom: "1.5rem" }}>
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowDiscardModal(false)}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientProfileModal;
