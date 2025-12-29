// petowner-mypets.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PawPrint, Plus, Trash2, ChevronDown, X, FileText, Activity, Syringe, AlertCircle, Pill, Scale, Scissors } from 'lucide-react';
import './styles/petowner-mypets.css';
import PawPattern from "./components/PawPattern";
import PetOwnerNavbar from './components/petowner-navbar';
import ProfileNotification from "./components/ProfileNotification";
import jsPDF from 'jspdf';


const PetOwnerMyPets = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showCard, setShowCard] = useState(true);
  const [pets, setPets] = useState([]);
  const [showAddPet, setShowAddPet] = useState(false);
  const [addPetStep, setAddPetStep] = useState(1);
  const [message, setMessage] = useState(null); // ✅ for styled notification
  const [confirmDelete, setConfirmDelete] = useState(null); // ✅ for delete confirmation
  const [activeTab, setActiveTab] = useState('health'); // Changed from 'examinations'
  const [activeHealthView, setActiveHealthView] = useState(null); // 'examinations', 'history', 'documents', etc.
  const [activeTrackingView, setActiveTrackingView] = useState(null); // 'weight', 'activity', 'symptoms', 'behavior'
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalType, setTrackingModalType] = useState(null); // 'weight', 'activity', 'symptoms', 'behavior'
  const [allTreatments, setAllTreatments] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newTrackingEntry, setNewTrackingEntry] = useState({
    date: '',
    weight: '',
    notes: '',
    activityType: '',
    duration: '',
    symptomTitle: '',
    symptomDescription: '',
    behaviorType: '',
    behaviorNote: ''
  });
  const [newPetData, setNewPetData] = useState({
    animalType: '',
    petName: '',
    breed: '',
    age: '',
    gender: '',
    hasVaccination: '',
    vaccinationDate: '',
    hasMedication: '',
    medicationDetails: '',
    hasAllergies: '',
    allergies: '',
    dietType: '',
    weight: '',
    behavioralNotes: ''
  });

const [soapNotes, setSoapNotes] = useState([]);
const [newSoapNote, setNewSoapNote] = useState({
  date: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: ''
});


const [examinations, setExaminations] = useState([]);
const [medicalHistory, setMedicalHistory] = useState({
  documents: [],
  vaccinations: [],
  conditions: [],
  currentMedications: [],
  surgeries: []
});

const fetchHealthRecords = async (petId) => {
  try {
    // Fetch examinations
    const examRes = await axios.get(`http://localhost:5000/api/pets/${petId}/examinations`);
    setExaminations(examRes.data);

    // Fetch medical history
    const historyRes = await axios.get(`http://localhost:5000/api/pets/${petId}/medical-history`);
    setMedicalHistory(historyRes.data);
  } catch (error) {
    console.error('Error fetching health records:', error);
  }
};

// ADD this state for real tracking data
const [trackingData, setTrackingData] = useState({
  weightLog: [],
  activityLog: [],
  symptomLog: [],
  behaviorLog: []
});

// ADD this function to fetch tracking data
const fetchTrackingData = async (petId) => {
  try {
    const [weightRes, activityRes, symptomRes, behaviorRes] = await Promise.all([
      axios.get(`http://localhost:5000/api/pets/${petId}/weight-log`),
      axios.get(`http://localhost:5000/api/pets/${petId}/activity-log`),
      axios.get(`http://localhost:5000/api/pets/${petId}/symptom-log`),
      axios.get(`http://localhost:5000/api/pets/${petId}/behavior-log`)
    ]);

    setTrackingData({
      weightLog: weightRes.data,
      activityLog: activityRes.data,
      symptomLog: symptomRes.data,
      behaviorLog: behaviorRes.data
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
  }
};

const fetchSoapNotes = async (petId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/pets/${petId}/soap-notes`);
    setSoapNotes(response.data);
  } catch (error) {
    console.error('Error fetching SOAP notes:', error);
  }
};

// Fetch all treatments
const fetchAllTreatments = async (petId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/pets/${petId}/all-treatments`);
    setAllTreatments(response.data);
  } catch (error) {
    console.error('Error fetching treatments:', error);
    setAllTreatments([]);
  }
};

// Fetch all prescriptions
const fetchAllPrescriptions = async (petId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/pets/${petId}/all-medications`);
    setAllPrescriptions(response.data);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    setAllPrescriptions([]);
  }
};


const [expandedExam, setExpandedExam] = useState(null);





  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const userId = sessionStorage.getItem('userid');

      if (!userId) {
        console.error('No user ID found in localStorage');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/pets/${userId}`);

      // ✅ Map database field names to consistent frontend keys
      const formattedPets = response.data.map(p => ({
        id: p.pet_id,
        name: p.pet_name,
        species: p.pet_species,
        breed: p.pet_breed,
        age: p.pet_age,
        gender: p.pet_gender,
        hasVaccination: p.pet_hasVaccination,
        vaccinationDate: p.pet_vaccinationDate,
        hasMedication: p.pet_hasMedication,
        medicationDetails: p.pet_medicationDetails,
        hasAllergies: p.pet_hasAllergies,
        allergyDetails: p.pet_allergyDetails,
        dietType: p.pet_dietType,
        weight: p.pet_weight,
        behavioralNotes: p.pet_behavioralNotes,
        updatedAt: p.pet_lastUpdated,
        petImage: p.pet_image,
      }));

      setPets(formattedPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };


  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setShowCard(false);
    setShowAddPet(false);
    fetchTrackingData(pet.id);
    fetchHealthRecords(pet.id);
    fetchSoapNotes(pet.id);
    fetchAllTreatments(pet.id);      // ADD THIS
    fetchAllPrescriptions(pet.id);   // ADD THIS
  };

  const toggleCard = () => {
    setShowCard(true);
    setSelectedPet(null);
    setShowAddPet(false);
  };

  const handleAddPetClick = () => {
    setShowAddPet(true);
    setShowCard(false);
    setSelectedPet(null);
    setAddPetStep(1);
    setNewPetData({
      animalType: '',
      petName: '',
      breed: '',
      age: '',
      gender: '',
      hasVaccination: '',
      vaccinationDate: '',
      hasMedication: '',
      medicationDetails: '',
      hasAllergies: '',
      allergies: '',
      dietType: '',
      weight: '',
      behavioralNotes: ''
    });
  };

  const handleNewPetChange = (e) => {
    const { name, value } = e.target;
    setNewPetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPetNext = (e) => {
    e.preventDefault();
    if (addPetStep < 2) {
      setAddPetStep(prev => prev + 1);
    }
  };

  const handleAddPetBack = () => {
    if (addPetStep > 1) {
      setAddPetStep(prev => prev - 1);
    }
  };

  const handleSubmitNewPet = async (e) => {
    e.preventDefault();
    
    try {
      const userId = sessionStorage.getItem('userid');

      if (!userId) {
        console.error('User not logged in');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/add-pet', {
        userId,
        ...newPetData,
        gender: newPetData.gender === 'Male' ? 'm' : 'f'
      });


      // ✅ Removed popup alerts
      console.log(response.data.message || 'Pet added successfully');
      
      fetchPets(); // Refresh the pet list
      setShowAddPet(false);
      setShowCard(true);
    } catch (error) {
      console.error('Error adding pet:', error);
      // Removed alert for failure too (you can log or handle silently)
    }
  };
const handleDeletePet = (petId) => {
  // Instead of immediate deletion, show confirmation modal
  setConfirmDelete(petId);
  setMessage({
    type: 'confirm',
    text: 'Are you sure you want to delete this pet?',
  });
};

const confirmDeletePet = async (confirm) => {
  if (!confirm) {
    setMessage(null);
    setConfirmDelete(null);
    return;
  }

  try {
    await axios.delete(`http://localhost:5000/api/pets/${confirmDelete}`);

    setMessage({
      type: 'success',
      text: 'Pet deleted successfully!',
    });

    fetchPets();
    setSelectedPet(null);
    setShowCard(true);

    // Auto-hide message
    setTimeout(() => setMessage(null), 1000);
  } catch (error) {
    console.error('Error deleting pet:', error);
    setMessage({
      type: 'error',
      text: 'Failed to delete pet. Please try again.',
    });
  } finally {
    setConfirmDelete(null);
  }
};


const handleUpdatePet = async () => {
  if (!selectedPet) return;

  const requiredFields = ['name', 'species', 'breed', 'gender', 'age', 'weight', 'dietType'];
  const emptyFields = requiredFields.filter(
    (field) => !selectedPet[field] || selectedPet[field].toString().trim() === ''
  );

  if (emptyFields.length > 0) {
    setMessage({
      type: 'error',
      text: 'Please fill in all required fields before saving.',
    });
    return;
  }

  try {
    const updatedAt = new Date().toISOString();

    // 🟢 FIXED: Match backend column names
    const payload = {
      pet_name: selectedPet.name,
      pet_species: selectedPet.species,
      pet_breed: selectedPet.breed,
      pet_age: selectedPet.age,
      pet_gender: selectedPet.gender,
      pet_hasVaccination: selectedPet.hasVaccination,
      pet_vaccinationDate: selectedPet.vaccinationDate
        ? new Date(selectedPet.vaccinationDate).toISOString().split('T')[0]
        : null,
      pet_hasMedication: selectedPet.hasMedication,
      pet_medicationDetails: selectedPet.medicationDetails,
      pet_hasAllergies: selectedPet.hasAllergies,
      pet_allergyDetails: selectedPet.allergyDetails,
      pet_dietType: selectedPet.dietType,
      pet_weight: selectedPet.weight,
      pet_behavioralNotes: selectedPet.behavioralNotes,
    };

    await axios.put(`http://localhost:5000/api/pets/${selectedPet.id}`, payload);

    // ✅ Instantly update local state so UI reflects change
    setSelectedPet((prev) => ({ ...prev, updatedAt }));

    setMessage({
      type: 'success',
      text: 'Pet profile updated successfully!',
    });

    fetchPets();
    setIsEditing(false);

    setTimeout(() => setMessage(null), 1000);
  } catch (error) {
    console.error("Error updating pet:", error);
    setMessage({
      type: 'error',
      text: 'Failed to update pet. Please try again.',
    });
  }
};

const handleOpenTrackingModal = (type) => {
  setTrackingModalType(type);
  setShowTrackingModal(true);
  setNewTrackingEntry({
    date: new Date().toISOString().split('T')[0], // Today's date
    weight: '',
    notes: '',
    activityType: '',
    duration: '',
    symptomTitle: '',
    symptomDescription: '',
    behaviorType: '',
    behaviorNote: ''
  });
};

const handleCloseTrackingModal = () => {
  setShowTrackingModal(false);
  setTrackingModalType(null);
  setNewTrackingEntry({
    date: '',
    weight: '',
    notes: '',
    activityType: '',
    duration: '',
    symptomTitle: '',
    symptomDescription: '',
    behaviorType: '',
    behaviorNote: ''
  });
};

const handleTrackingInputChange = (field, value) => {
  setNewTrackingEntry(prev => ({
    ...prev,
    [field]: value
  }));
};

const handleSubmitTrackingEntry = async () => {
  // Validation
  if (trackingModalType === 'weight' && (!newTrackingEntry.weight || !newTrackingEntry.date)) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }
  if (trackingModalType === 'activity' && (!newTrackingEntry.activityType || !newTrackingEntry.duration || !newTrackingEntry.date)) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }
  if (trackingModalType === 'symptoms' && (!newTrackingEntry.symptomTitle || !newTrackingEntry.date)) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }
  if (trackingModalType === 'behavior' && (!newTrackingEntry.behaviorType || !newTrackingEntry.behaviorNote || !newTrackingEntry.date)) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }

  try {
    let endpoint = '';
    let payload = {};

    switch (trackingModalType) {
      case 'weight':
        endpoint = `http://localhost:5000/api/pets/${selectedPet.id}/weight-log`;
        payload = {
          weight: newTrackingEntry.weight,
          rec_date: newTrackingEntry.date,
          notes: newTrackingEntry.notes
        };
        break;
      case 'activity':
        endpoint = `http://localhost:5000/api/pets/${selectedPet.id}/activity-log`;
        payload = {
          activityType: newTrackingEntry.activityType,
          duration: newTrackingEntry.duration,
          activ_date: newTrackingEntry.date,
          notes: newTrackingEntry.notes
        };
        break;
      case 'symptoms':
        endpoint = `http://localhost:5000/api/pets/${selectedPet.id}/symptom-log`;
        payload = {
          symptomTitle: newTrackingEntry.symptomTitle,
          symptomDescription: newTrackingEntry.symptomDescription,
          symp_date: newTrackingEntry.date
        };
        break;
      case 'behavior':
        endpoint = `http://localhost:5000/api/pets/${selectedPet.id}/behavior-log`;
        payload = {
          behaviorType: newTrackingEntry.behaviorType,
          behaviorNote: newTrackingEntry.behaviorNote,
          behav_date: newTrackingEntry.date
        };
        break;
    }

    await axios.post(endpoint, payload);
    
    setMessage({ type: 'success', text: 'Entry added successfully!' });
    handleCloseTrackingModal();
    
    // Refresh tracking data
    fetchTrackingData(selectedPet.id);
    
    setTimeout(() => setMessage(null), 1500);
  } catch (error) {
    console.error('Error adding tracking entry:', error);
    setMessage({ type: 'error', text: 'Failed to add entry. Please try again.' });
  }
};

const handleSoapInputChange = (field, value) => {
  setNewSoapNote(prev => ({
    ...prev,
    [field]: value
  }));
};

const handleSubmitSoapNote = async () => {
  if (!newSoapNote.date || !newSoapNote.subjective) {
    setMessage({ type: 'error', text: 'Please fill in at least the date and subjective fields' });
    return;
  }

  try {
    await axios.post(`http://localhost:5000/api/pets/${selectedPet.id}/soap-notes`, {
      soap_date: newSoapNote.date,
      subj: newSoapNote.subjective,
      obj: newSoapNote.objective,
      assess: newSoapNote.assessment,
      plan: newSoapNote.plan
    });

    setMessage({ type: 'success', text: 'SOAP note saved successfully!' });
    
    // Reset form
    setNewSoapNote({
      date: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    });
    
    // Refresh SOAP notes
    fetchSoapNotes(selectedPet.id);
    
    setTimeout(() => setMessage(null), 1500);
  } catch (error) {
    console.error('Error saving SOAP note:', error);
    setMessage({ type: 'error', text: 'Failed to save SOAP note. Please try again.' });
  }
};


const [isEditing, setIsEditing] = useState(false);

  // ✅ Add this right before your `return`
  

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState({
      petInfo: true,
      healthRecords: true,
      trackingMonitoring: true
    });

    const handleExportClick = () => {
      setShowExportModal(true);
    };
    
    const handleExportOptionChange = (option) => {
      setExportOptions(prev => ({
        ...prev,
        [option]: !prev[option]
      }));
    };
    
    const handleExportConfirm = async () => {
      setMessage({
        type: 'success',
        text: 'Generating PDF... Please wait.'
      });
      
      setShowExportModal(false);
    
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = margin;
    
        // Helper function to add new page if needed
        const checkAddPage = (requiredSpace = 10) => {
          if (yPos + requiredSpace > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
            return true;
          }
          return false;
        };
    
        // Helper function to add text with wrapping
        const addText = (text, x, y, options = {}) => {
          const fontSize = options.fontSize || 10;
          const maxWidth = options.maxWidth || contentWidth;
          const lineHeight = options.lineHeight || 6;
          
          pdf.setFontSize(fontSize);
          if (options.bold) pdf.setFont(undefined, 'bold');
          else pdf.setFont(undefined, 'normal');
          
          const lines = pdf.splitTextToSize(String(text || ''), maxWidth);
          lines.forEach((line, index) => {
            checkAddPage();
            pdf.text(line, x, y + (index * lineHeight));
          });
          
          return y + (lines.length * lineHeight);
        };
    
        // Header with light blue background
        pdf.setFillColor(240, 247, 255);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        // Title
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${selectedPet.name}'s Medical Records`, pageWidth / 2, 18, { align: 'center' });
        
        // Subtitle
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Generated on ${new Date().toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}`, pageWidth / 2, 28, { align: 'center' });
        
        pdf.text('TeleVet Pet Management System', pageWidth / 2, 34, { align: 'center' });
        
        // Divider line
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(margin, 42, pageWidth - margin, 42);
        
        yPos = 50;
        pdf.setTextColor(15, 23, 42);
    
        // Pet Information Section
        if (exportOptions.petInfo) {
          checkAddPage(60);
          
          // Section header
          pdf.setFillColor(240, 247, 255);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'S');
          
          pdf.setTextColor(30, 58, 138);
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('PET INFORMATION', margin + 5, yPos + 6.5);
          yPos += 15;
          
          // Pet info in two columns - FIXED
          const infoItems = [
            ['Name', selectedPet.name],
            ['Species', selectedPet.species],
            ['Breed', selectedPet.breed],
            ['Gender', selectedPet.gender === 'm' ? 'Male' : 'Female'],
            ['Age', `${selectedPet.age} years`],
            ['Weight', `${selectedPet.weight} kg`],
            ['Diet Type', selectedPet.dietType || 'N/A'],
            ['Vaccination', selectedPet.hasVaccination === 'yes' ? 'Yes' : 'No']
          ];
    
          const columnWidth = contentWidth / 2;
          const labelWidth = 35;
          
          for (let i = 0; i < infoItems.length; i += 2) {
            checkAddPage(10);
            
            // Left column
            const [label1, value1] = infoItems[i];
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(71, 85, 105);
            pdf.text(`${label1}:`, margin, yPos);
            
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(15, 23, 42);
            pdf.text(String(value1), margin + labelWidth, yPos);
            
            // Right column (if exists)
            if (i + 1 < infoItems.length) {
              const [label2, value2] = infoItems[i + 1];
              const rightColX = margin + columnWidth + 5;
              
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(71, 85, 105);
              pdf.text(`${label2}:`, rightColX, yPos);
              
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(15, 23, 42);
              pdf.text(String(value2), rightColX + labelWidth, yPos);
            }
            
            yPos += 7;
          }
    
          yPos += 5;
    
          // Behavioral Notes
          if (selectedPet.behavioralNotes) {
            checkAddPage(20);
            
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(71, 85, 105);
            pdf.text('BEHAVIORAL NOTES:', margin, yPos);
            yPos += 6;
            
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(15, 23, 42);
            yPos = addText(selectedPet.behavioralNotes, margin, yPos, { 
              maxWidth: contentWidth,
              fontSize: 9 
            });
            
            yPos += 5;
          }
    
          yPos += 10;
        }
    
        // Health Records Section
        if (exportOptions.healthRecords) {
          checkAddPage(60);
          
          // Section header
          pdf.setFillColor(240, 247, 255);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'S');
          
          pdf.setTextColor(30, 58, 138);
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('HEALTH RECORDS', margin + 5, yPos + 6.5);
          yPos += 15;
    
          // Examinations
          if (examinations.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Examinations & Treatments', margin, yPos);
            yPos += 8;
    
            examinations.forEach((exam, index) => {
              checkAddPage(35);
              
              if (index > 0) {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 3;
              }
              
              // Type and date
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(15, 23, 42);
              pdf.text(`${exam.appt_type} - ${exam.consultation_type}`, margin, yPos);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(100, 116, 139);
              pdf.text(new Date(exam.appt_date).toLocaleDateString('en-GB'), pageWidth - margin, yPos, { align: 'right' });
              
              yPos += 5;
              
              // Details
              pdf.setFontSize(9);
              pdf.setTextColor(71, 85, 105);
              pdf.text(`Vet: ${exam.vet_name}`, margin + 3, yPos);
              yPos += 4;
              pdf.text(`Clinic: ${exam.clinic_name}`, margin + 3, yPos);
              yPos += 4;
              pdf.text(`Status: ${exam.appt_status}`, margin + 3, yPos);
              yPos += 4;
              
              if (exam.appt_description) {
                yPos += 2;
                pdf.setFont(undefined, 'bold');
                pdf.text('Description:', margin + 3, yPos);
                pdf.setFont(undefined, 'normal');
                yPos += 4;
                yPos = addText(exam.appt_description, margin + 3, yPos, { 
                  fontSize: 9, 
                  maxWidth: contentWidth - 6
                });
              }
              
              yPos += 8;
            });
            
            yPos += 5;
          }
    
          // Prescriptions - FIXED
          if (allPrescriptions.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Prescriptions', margin, yPos);
            yPos += 8;
    
            allPrescriptions.forEach((p, index) => {
              checkAddPage(25);
              
              if (index > 0) {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 3;
              }
              
              // Medication name
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(15, 23, 42);
              pdf.text(String(p.medication || 'N/A'), margin, yPos);
              
              // Status indicator - FIXED
              pdf.setFontSize(8);
              pdf.setFont(undefined, 'normal');
              const isActive = !p.end_date || new Date(p.end_date) >= new Date();
              const statusText = isActive ? 'Active' : 'Completed';
              const statusColor = isActive ? [34, 197, 94] : [148, 163, 184];
              pdf.setTextColor(...statusColor);
              pdf.text(statusText, pageWidth - margin, yPos, { align: 'right' });
              
              pdf.setTextColor(71, 85, 105);
              yPos += 6;
              
              // Details
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.text(`Dosage: ${p.dose || 'N/A'}`, margin + 3, yPos);
              yPos += 4;
              pdf.text(`Frequency: ${p.frequency || 'N/A'}`, margin + 3, yPos);
              yPos += 4;
              pdf.text(`Duration: ${p.duration || 'N/A'}`, margin + 3, yPos);
              yPos += 4;
              
              if (p.instructions) {
                pdf.setFont(undefined, 'bold');
                pdf.text('Instructions:', margin + 3, yPos);
                pdf.setFont(undefined, 'normal');
                yPos += 4;
                yPos = addText(p.instructions, margin + 3, yPos, { 
                  fontSize: 9, 
                  maxWidth: contentWidth - 6 
                });
                yPos += 2;
              }
              
              yPos += 6;
            });
            
            yPos += 5;
          }
    
          // SOAP Notes
          if (soapNotes.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('SOAP Notes', margin, yPos);
            yPos += 8;
    
            soapNotes.forEach((note, index) => {
              checkAddPage(30);
              
              if (index > 0) {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 3;
              }
              
              // Date
              pdf.setFontSize(9);
              pdf.setTextColor(100, 116, 139);
              pdf.text(new Date(note.soap_date).toLocaleDateString('en-GB'), margin, yPos);
              yPos += 6;
              
              pdf.setTextColor(15, 23, 42);
              
              if (note.subj) {
                pdf.setFont(undefined, 'bold');
                pdf.setFontSize(9);
                pdf.text('Subjective:', margin + 3, yPos);
                yPos += 4;
                pdf.setFont(undefined, 'normal');
                yPos = addText(note.subj, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
                yPos += 3;
              }
              
              if (note.obj) {
                checkAddPage(10);
                pdf.setFont(undefined, 'bold');
                pdf.text('Objective:', margin + 3, yPos);
                yPos += 4;
                pdf.setFont(undefined, 'normal');
                yPos = addText(note.obj, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
                yPos += 3;
              }
              
              if (note.assess) {
                checkAddPage(10);
                pdf.setFont(undefined, 'bold');
                pdf.text('Assessment:', margin + 3, yPos);
                yPos += 4;
                pdf.setFont(undefined, 'normal');
                yPos = addText(note.assess, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
                yPos += 3;
              }
              
              if (note.plan) {
                checkAddPage(10);
                pdf.setFont(undefined, 'bold');
                pdf.text('Plan:', margin + 3, yPos);
                yPos += 4;
                pdf.setFont(undefined, 'normal');
                yPos = addText(note.plan, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
                yPos += 3;
              }
              
              yPos += 6;
            });
          }
    
          yPos += 10;
        }
    
        // Tracking & Monitoring Section
        if (exportOptions.trackingMonitoring) {
          checkAddPage(60);
          
          // Section header
          pdf.setFillColor(240, 247, 255);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'S');
          
          pdf.setTextColor(30, 58, 138);
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('TRACKING & MONITORING', margin + 5, yPos + 6.5);
          yPos += 15;
    
          // Weight Log
          if (trackingData.weightLog.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Weight Log', margin, yPos);
            yPos += 8;
    
            trackingData.weightLog.forEach(w => {
              checkAddPage(8);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(71, 85, 105);
              
              const dateStr = new Date(w.rec_date).toLocaleDateString('en-GB');
              const weightStr = `${w.weight} kg`;
              const notesStr = w.notes ? ` - ${w.notes}` : '';
              
              pdf.text(`${dateStr}: ${weightStr}${notesStr}`, margin + 3, yPos);
              
              yPos += 5;
            });
            yPos += 8;
          }
    
          // Activity Log
          if (trackingData.activityLog.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Activity Log', margin, yPos);
            yPos += 8;
    
            trackingData.activityLog.forEach(a => {
              checkAddPage(8);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(71, 85, 105);
              
              const dateStr = new Date(a.activ_date).toLocaleDateString('en-GB');
              const activityStr = `${a.activ_type} (${a.duration_min} min)`;
              const notesStr = a.notes ? ` - ${a.notes}` : '';
              
              pdf.text(`${dateStr}: ${activityStr}${notesStr}`, margin + 3, yPos);
              
              yPos += 5;
            });
            yPos += 8;
          }
    
          // Symptom Log
          if (trackingData.symptomLog.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Symptom Diary', margin, yPos);
            yPos += 8;
    
            trackingData.symptomLog.forEach((s, index) => {
              checkAddPage(15);
              
              if (index > 0) {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 3;
              }
              
              // Title and date
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(15, 23, 42);
              pdf.text(String(s.symp_title || 'N/A'), margin, yPos);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(100, 116, 139);
              pdf.text(new Date(s.symp_date).toLocaleDateString('en-GB'), pageWidth - margin, yPos, { align: 'right' });
              
              yPos += 6;
              
              // Description
              pdf.setFontSize(9);
              pdf.setTextColor(71, 85, 105);
              yPos = addText(s.symp_desc, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
              
              yPos += 6;
            });
            
            yPos += 5;
          }
    
          // Behavior Log
          if (trackingData.behaviorLog.length > 0) {
            checkAddPage(25);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Behavioral Notes', margin, yPos);
            yPos += 8;
    
            trackingData.behaviorLog.forEach((b, index) => {
              checkAddPage(15);
              
              if (index > 0) {
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.2);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 3;
              }
              
              // Type and date
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(15, 23, 42);
              pdf.text(String(b.behav_type || 'N/A'), margin, yPos);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(100, 116, 139);
              pdf.text(new Date(b.behav_date).toLocaleDateString('en-GB'), pageWidth - margin, yPos, { align: 'right' });
              
              yPos += 6;
              
              // Note
              pdf.setFontSize(9);
              pdf.setTextColor(71, 85, 105);
              yPos = addText(b.behav_note, margin + 3, yPos, { fontSize: 9, maxWidth: contentWidth - 6 });
              
              yPos += 6;
            });
          }
        }
    
        // Footer
        checkAddPage(25);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont(undefined, 'normal');
        pdf.text('This document was generated from TeleVet Pet Management System', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        pdf.text('For veterinary use and pet owner records', pageWidth / 2, yPos, { align: 'center' });
        yPos += 4;
        pdf.text('Please consult your veterinarian for medical advice', pageWidth / 2, yPos, { align: 'center' });
    
        // Save the PDF
        pdf.save(`${selectedPet.name}_Medical_Records_${new Date().toISOString().split('T')[0]}.pdf`);
    
        setMessage({
          type: 'success',
          text: 'PDF exported successfully!'
        });
    
        setTimeout(() => setMessage(null), 2000);
    
      } catch (error) {
        console.error('Error generating PDF:', error);
        
        setMessage({
          type: 'error',
          text: 'Failed to generate PDF. Please try again.'
        });
    
        setTimeout(() => setMessage(null), 3000);
      }
    };

  const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }
};

const handleImageUpload = async () => {
  if (!selectedImage || !selectedPet) return;

  const formData = new FormData();
  formData.append('image', selectedImage);

  try {
    const response = await axios.post(
      `http://localhost:5000/api/pets/${selectedPet.id}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    setMessage({
      type: 'success',
      text: 'Pet image uploaded successfully!',
    });

    // Update local state
    setSelectedPet(prev => ({
      ...prev,
      petImage: response.data.imageUrl
    }));

    setSelectedImage(null);
    setImagePreview(null);
    fetchPets();

    setTimeout(() => setMessage(null), 2000);
  } catch (error) {
    console.error('Error uploading image:', error);
    setMessage({
      type: 'error',
      text: 'Failed to upload image. Please try again.',
    });
  }
};

const handleImageDelete = async () => {
  if (!selectedPet) return;

  try {
    await axios.delete(`http://localhost:5000/api/pets/${selectedPet.id}/delete-image`);

    setMessage({
      type: 'success',
      text: 'Pet image deleted successfully!',
    });

    setSelectedPet(prev => ({
      ...prev,
      petImage: null
    }));

    setImagePreview(null);
    fetchPets();

    setTimeout(() => setMessage(null), 2000);
  } catch (error) {
    console.error('Error deleting image:', error);
    setMessage({
      type: 'error',
      text: 'Failed to delete image. Please try again.',
    });
  }
};

const handleViewDocument = (fileUrl) => {
  if (!fileUrl) {
    setMessage({ type: 'error', text: 'No file available' });
    return;
  }
  window.open(`http://localhost:5000${fileUrl}`, '_blank');
};

const handleDownloadDocument = (fileUrl, title) => {
  if (!fileUrl) {
    setMessage({ type: 'error', text: 'No file available' });
    return;
  }
  
  fetch(`http://localhost:5000${fileUrl}`)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Download error:', error);
      setMessage({ type: 'error', text: 'Failed to download file' });
    });
};

const handleViewDocumentModal = (fileUrl, title) => {
  if (!fileUrl) {
    setMessage({ type: 'error', text: 'No file available' });
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;
  
  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    border-radius: 16px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    position: relative;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
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
  
  const fileExtension = fileUrl.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
    const img = document.createElement('img');
    img.src = `http://localhost:5000${fileUrl}`;
    img.style.cssText = 'max-width: 100%; max-height: 90vh; display: block;';
    container.appendChild(img);
  } else if (fileExtension === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = `http://localhost:5000${fileUrl}`;
    iframe.style.cssText = 'width: 80vw; height: 90vh; border: none;';
    container.appendChild(iframe);
  } else {
    handleDownloadDocument(fileUrl, title);
    return;
  }
  
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
};

  return (
    
    <div className="mypets-container">
    <PawPattern count={35} />
    <PetOwnerNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    {/* ✅ Global Notification Overlay (with Yes/Cancel for delete) */}
    {message && (
      <div className="notification-overlay">
        <div className={`notification-modal ${message.type}`}>
          <p>{message.text}</p>

          {/* Show Yes/Cancel only for delete confirmation */}
          {message.type === 'confirm' && (
            <div className="notification-buttons">
              <button
                className="confirm-btn yes"
                onClick={() => confirmDeletePet(true)}
              >
                Yes
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => confirmDeletePet(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )}


      <div className="mypets-content">
        <ProfileNotification firstName={sessionStorage.getItem("firstName")} />

        {/* Pet Cards */}
        {showCard && (
          <div className="pet-cards-row">
            {pets.map((pet, index) => (
              <div
                key={index}
                className="pet-card"
                onClick={() => handlePetClick(pet)}
              >
                <div className="pet-card-image">
                  {pet.petImage ? (
                    <img src={`http://localhost:5000${pet.petImage}`} alt={pet.name} />
                  ) : (
                    <PawPrint size={64} color="#888" />
                  )}
                </div>
                <div className="pet-card-name">{pet.name}</div>
                <div className="pet-card-details">
                  <div className="detail-box">
                    {pet.gender === 'm' ? 'Male' : pet.gender === 'f' ? 'Female' : pet.gender}
                  </div>
                  <div className="detail-box">{pet.age} years</div>
                  <div className="detail-box">{pet.weight} kg</div>
                </div>
              </div>
            ))}

            <div className="pet-card add-pet-card" onClick={handleAddPetClick}>
              <Plus size={32} color="#888" />
              <div className="add-pet-text">Add Pet</div>
            </div>
          </div>
        )}

        {/* Toggle Arrow */}
        {(selectedPet || showAddPet) && !showCard && (
          <div className="toggle-arrow" onClick={toggleCard}>
            <ChevronDown size={32} />
          </div>
        )}

        {/* Add Pet Form */}
        {showAddPet && !showCard && (
          <div className="pet-details-section add-pet-form">
            <div className="pet-details-header">
              <h2>Add New Pet</h2>
              <button className="close-btn" onClick={toggleCard}>
                <X size={24} />
              </button>
            </div>

            <div className="details-container">
              <div className="section-box section-wide">
                <form onSubmit={addPetStep === 2 ? handleSubmitNewPet : handleAddPetNext}>
                  {/* Step 1: Pet Basics */}
                  {addPetStep === 1 && (
                    <div className="form-content">
                      <h3>Pet Basics</h3>
                      <div className="form-group">
                        <label>Animal Type:</label>
                        <select name="animalType" value={newPetData.animalType} onChange={handleNewPetChange} required>
                          <option value="">Select</option>
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Pet Name:</label>
                        <input type="text" name="petName" value={newPetData.petName} onChange={handleNewPetChange} required />
                      </div>
                      <div className="form-group">
                        <label>Breed:</label>
                        <input type="text" name="breed" value={newPetData.breed} onChange={handleNewPetChange} required />
                      </div>
                     <div className="form-group">
                        <label>Age:</label>
                        <input type="number" name="age" value={newPetData.age}
                              onChange={handleNewPetChange} required min="0" />
                      </div>
                      <div className="form-group">
                        <label>Gender:</label>
                        <select name="gender" value={newPetData.gender} onChange={handleNewPetChange} required>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="form-buttons">
                        <button type="submit" className="btn-next">Next</button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Pet Details */}
                  {addPetStep === 2 && (
                    <div className="form-content">
                      <h3>Medical History</h3>
                      <div className="form-group">
                        <label>Vaccination:</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasVaccination" value="yes" checked={newPetData.hasVaccination === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasVaccination" value="no" checked={newPetData.hasVaccination === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasVaccination === 'yes' && (
                        <div className="form-group">
                          <label>Date of Vaccination:</label>
                          <input type="date" name="vaccinationDate" value={newPetData.vaccinationDate} onChange={handleNewPetChange} required />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Current Medication:</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasMedication" value="yes" checked={newPetData.hasMedication === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasMedication" value="no" checked={newPetData.hasMedication === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasMedication === 'yes' && (
                        <div className="form-group">
                          <label>Medication Details:</label>
                          <textarea name="medicationDetails" value={newPetData.medicationDetails} onChange={handleNewPetChange} required />
                        </div>
                      )}

                      <h3>Allergies</h3>
                      <div className="form-group">
                        <label>Do they have allergies?</label>
                        <div className="radio-group">
                          <label>
                            <input type="radio" name="hasAllergies" value="yes" checked={newPetData.hasAllergies === 'yes'} onChange={handleNewPetChange} required />
                            Yes
                          </label>
                          <label>
                            <input type="radio" name="hasAllergies" value="no" checked={newPetData.hasAllergies === 'no'} onChange={handleNewPetChange} />
                            No
                          </label>
                        </div>
                      </div>
                      {newPetData.hasAllergies === 'yes' && (
                        <div className="form-group">
                          <label>List Allergies:</label>
                          <textarea name="allergies" value={newPetData.allergies} onChange={handleNewPetChange} placeholder="E.g., pollen, chicken, dairy" required />
                        </div>
                      )}

                      <h3>Diet</h3>
                      <div className="form-group">
                        <label>Diet Type:</label>
                        <textarea name="dietType" value={newPetData.dietType} onChange={handleNewPetChange} placeholder="E.g., commercial food types (dry, wet, semi-moist), home-cooked, and raw meat-based" required />
                      </div>

                      <h3>Weight</h3>
                      <div className="form-group">
                        <label>Weight (kg):</label>
                        <input type="number" name="weight" value={newPetData.weight} onChange={handleNewPetChange} placeholder="0.0" step="0.1" required />
                      </div>

                      <h3>Behavioral Notes</h3>
                      <div className="form-group">
                        <textarea name="behavioralNotes" value={newPetData.behavioralNotes} onChange={handleNewPetChange} placeholder="E.g., aggression, anxiety, chewing" />
                      </div>

                      <div className="form-buttons">
                        <button type="submit" className="btn-submit">Add Pet</button>
                        <button type="button" onClick={handleAddPetBack} className="btn-back">Back</button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Pet Details */}
        {selectedPet && !showCard && !showAddPet && (
          <div className="pet-details-section">

            
            

            <div className="pet-details-header">
              <h2>{selectedPet.name}</h2>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'health' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('health'); setActiveHealthView(null); }}
                >
                  Health Records
                </button>
                <button
                  className={`tab ${activeTab === 'tracking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tracking')}
                >
                  Tracking & Monitoring
                </button>
              </div>
            </div>


            <div className="details-container">
            {/* Main Content Area */}
            <div className="section-box section-left">
              {activeTab === 'health' ? (
                <div className="section-content">
                  {!activeHealthView ? (
                    /* Health Dashboard - Icon Grid */
                    <div className="dashboard-grid">
                    <div className="dashboard-card" onClick={() => setActiveHealthView('examinations')}>
                      <Activity size={32} />
                      <h4>Examinations & Treatment</h4>
                      <p>{examinations.length} records</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('treatments')}>
                      <Activity size={32} />
                      <h4>Treatments</h4>
                      <p>{allTreatments?.length || 0} treatments</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('prescriptions')}>
                      <Pill size={32} />
                      <h4>Prescriptions</h4>
                      <p>{allPrescriptions?.length || 0} prescriptions</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('soap')}>
                      <FileText size={32} />
                      <h4>SOAP Notes</h4>
                      <p>{soapNotes?.length || 0} notes</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('documents')}>
                      <FileText size={32} />
                      <h4>Documents & Attachments</h4>
                      <p>{medicalHistory.documents.length} files</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('vaccinations')}>
                      <Syringe size={32} />
                      <h4>Vaccination History</h4>
                      <p>{medicalHistory.vaccinations.length} vaccines</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('conditions')}>
                      <AlertCircle size={32} />
                      <h4>Chronic Conditions</h4>
                      <p>{medicalHistory.conditions.length} conditions</p>
                    </div>

                    <div className="dashboard-card" onClick={() => setActiveHealthView('surgeries')}>
                      <Scissors size={32} />
                      <h4>Surgical History</h4>
                      <p>{medicalHistory.surgeries.length} surgeries</p>
                    </div>
                  </div>
                  ) : (
                    /* Detailed View with Back Button */
                    <div className="detailed-view">
                      <button className="back-to-dashboard" onClick={() => setActiveHealthView(null)}>
                        ← Back to Dashboard
                      </button>

                      {/* Examinations View */}
                      {activeHealthView === 'examinations' && (
                        <>
                          <h3>Examinations & Treatment History</h3>
                          {examinations.length === 0 ? (
                            <p className="no-data">No examinations or treatments recorded yet.</p>
                          ) : (
                            <div className="examinations-list">
                              {examinations.map((exam) => (
                                <div key={exam.appt_id} className="examination-card">
                                  {/* Keep existing examination card structure */}
                                  <div className="exam-header" onClick={() => setExpandedExam(expandedExam === exam.appt_id ? null : exam.appt_id)}>
                                    <div className="exam-header-left">
                                      <span className={`exam-type exam-${exam.appt_type.toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-')}`}>
                                        {exam.appt_type}
                                      </span>
                                      <span className="exam-date">
                                        {new Date(exam.appt_date).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </span>
                                      <span className={`exam-status ${exam.appt_status}`}>
                                        {exam.appt_status}
                                      </span>
                                    </div>
                                    <ChevronDown 
                                      size={20} 
                                      className={`expand-icon ${expandedExam === exam.appt_id ? 'expanded' : ''}`}
                                    />
                                  </div>

                                  <div className="exam-summary">
                                    <p><strong>Vet:</strong> {exam.vet_name}</p>
                                    <p><strong>Clinic:</strong> {exam.clinic_name}</p>
                                    <p><strong>Type:</strong> {exam.consultation_type}</p>
                                    {exam.appt_description && <p><strong>Description:</strong> {exam.appt_description}</p>}
                                  </div>

                                  {expandedExam === exam.appt_id && (
                                    <div className="exam-details">
                                      {/* treatments, prescriptions sections */}

                                      {exam.treatments && exam.treatments.length > 0 && (
                                        <div className="treatments-section">
                                          <h4>Treatments Administered</h4>
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
                                              {exam.treatments.map((treatment, idx) => (
                                                <tr key={idx}>
                                                  <td>{treatment.type}</td>
                                                  <td>{treatment.dose}</td>
                                                  <td>{treatment.frequency}</td>
                                                  <td>{treatment.duration}</td>
                                                  <td>{treatment.notes}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {exam.prescriptions && exam.prescriptions.length > 0 && (
                                        <div className="prescriptions-section">
                                          <h4>Prescriptions</h4>
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
                                              {exam.prescriptions.map((rx, idx) => (
                                                <tr key={idx}>
                                                  <td>{rx.medication}</td>
                                                  <td>{rx.dose}</td>
                                                  <td>{rx.frequency}</td>
                                                  <td>{rx.duration}</td>
                                                  <td>{rx.instructions}</td>
                                                  <td>
                                                    {rx.start_date} {rx.end_date ? `to ${rx.end_date}` : '(Ongoing)'}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Treatments View */}
                      {activeHealthView === 'treatments' && (
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
                                    <td>{treatment.admin_date ? new Date(treatment.admin_date).toLocaleDateString('en-GB') : 'N/A'}</td>
                                    <td>{treatment.type}</td>
                                    <td>{treatment.dose}</td>
                                    <td>{treatment.frequency || 'N/A'}</td>
                                    <td>{treatment.duration || 'N/A'}</td>
                                    <td>{treatment.notes || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}

                      {/* Documents View */}
                      {activeHealthView === 'documents' && (
                        <>
                          <h3>Documents & Attachments</h3>
                          {medicalHistory.documents.length === 0 ? (
                            <p className="no-data">No documents uploaded.</p>
                          ) : (
                            <div className="documents-grid">
                              {medicalHistory.documents.map((doc) => (
                                <div 
                                  key={doc.id} 
                                  className="document-card"
                                  style={{ 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column'
                                  }}
                                  onClick={() => handleViewDocumentModal(doc.file_url, doc.title)}
                                >
                                  <div className="doc-icon">
                                    {doc.type === 'xray' ? <Activity size={24} color="#4f46e5" /> : 
                                    doc.type === 'lab' ? <FileText size={24} color="#059669" /> : 
                                    <FileText size={24} color="#64748b" />}
                                  </div>
                                  <div className="doc-info">
                                    <strong>{doc.title}</strong>
                                    <span className="doc-date">{new Date(doc.date).toLocaleDateString('en-GB')}</span>
                                  </div>
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '0.5rem', 
                                    marginTop: '0.75rem',
                                    width: '100%'
                                  }}>
                                    <button 
                                      className="doc-download"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadDocument(doc.file_url, doc.title);
                                      }}
                                      style={{ 
                                        background: 'linear-gradient(135deg, #a8e6cf 0%, #98ddc0 100%)',
                                        color: '#065f46',
                                        flex: 1,
                                        padding: '0.5rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Vaccinations View */}
                      {activeHealthView === 'vaccinations' && (
                        <>
                          <h3>Vaccination History</h3>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Vaccine</th>
                                <th>Last Given</th>
                                <th>Next Due</th>
                                <th>Veterinarian</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medicalHistory.vaccinations.map((vac, idx) => (
                                <tr key={idx} className={new Date(vac.next_date) < new Date() ? 'overdue' : ''}>
                                  <td>{vac.vaccine}</td>
                                  <td>{new Date(vac.vac_date).toLocaleDateString('en-GB')}</td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span>{new Date(vac.next_date).toLocaleDateString('en-GB')}</span>
                                      {new Date(vac.next_date) < new Date() && <span className="badge overdue-badge">Overdue</span>}
                                    </div>
                                  </td>
                                  <td>{vac.vet}</td>
                                  <td>{vac.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}

                      {/* Conditions View */}
                      {activeHealthView === 'conditions' && (
                        <>
                          <h3>Chronic Conditions & Diagnoses</h3>
                          {medicalHistory.conditions.length === 0 ? (
                            <p className="no-data">No chronic conditions recorded.</p>
                          ) : (
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Condition</th>
                                  <th>Diagnosed</th>
                                  <th>Status</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {medicalHistory.conditions.map((cond, idx) => (
                                  <tr key={idx}>
                                    <td>{cond.condition}</td>
                                    <td>{new Date(cond.diag_date).toLocaleDateString('en-GB')}</td>
                                    <td><span className={`badge ${cond.status}`}>{cond.status}</span></td>
                                    <td>{cond.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}

                      {/* Medications View */}
                      {activeHealthView === 'prescriptions' && (
                        <>
                          <h3>All Medications & Prescriptions</h3>
                          {allPrescriptions.length === 0 ? (
                            <p className="no-data">No prescriptions recorded.</p>
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
                                {allPrescriptions.map((med, idx) => {
                                  const isActive = !med.end_date || new Date(med.end_date) >= new Date();
                                  return (
                                    <tr key={idx}>
                                      <td>{med.medication}</td>
                                      <td>{med.dose}</td>
                                      <td>{med.frequency}</td>
                                      <td>{med.duration}</td>
                                      <td>{med.instructions || 'N/A'}</td>
                                      <td>{med.start_date ? new Date(med.start_date).toLocaleDateString('en-GB') : 'N/A'}</td>
                                      <td>{med.end_date ? new Date(med.end_date).toLocaleDateString('en-GB') : 'Ongoing'}</td>
                                      <td>
                                        <span className={`badge ${isActive ? 'active' : 'resolved'}`}>
                                          {isActive ? 'Active' : 'Completed'}
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

                      {/* Surgeries View */}
                      {activeHealthView === 'surgeries' && (
                        <>
                          <h3>Surgical History</h3>
                          {medicalHistory.surgeries.length === 0 ? (
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
                                </tr>
                              </thead>
                              <tbody>
                                {medicalHistory.surgeries.map((surg, idx) => (
                                  <tr key={idx}>
                                    <td>{surg.name}</td>
                                    <td>{new Date(surg.date).toLocaleDateString('en-GB')}</td>
                                    <td>{surg.vet}</td>
                                    <td>{surg.notes}</td>
                                    <td>{surg.complications}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}

                      {/* SOAP Notes - Pet Owner's Personal Notes */}
                      {activeHealthView === 'soap' && (
                        <>
                          <h3>My SOAP Notes</h3>
                          <p className="soap-description">Keep track of your pet's daily observations and health notes.</p>
                          <div className="soap-form">
                            <div className="form-group">
                              <label>Date: *</label>
                              <input 
                                type="date" 
                                value={newSoapNote.date}
                                onChange={(e) => handleSoapInputChange('date', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Subjective (What you noticed): *</label>
                              <textarea 
                                placeholder="E.g., Pet seems more tired than usual, drinking more water..." 
                                rows="3"
                                value={newSoapNote.subjective}
                                onChange={(e) => handleSoapInputChange('subjective', e.target.value)}
                              ></textarea>
                            </div>
                            <div className="form-group">
                              <label>Objective (Measurements):</label>
                              <textarea 
                                placeholder="E.g., Temperature: 38.5°C, Ate 150g of food..." 
                                rows="3"
                                value={newSoapNote.objective}
                                onChange={(e) => handleSoapInputChange('objective', e.target.value)}
                              ></textarea>
                            </div>
                            <div className="form-group">
                              <label>Assessment (Your thoughts):</label>
                              <textarea 
                                placeholder="E.g., Might be related to hot weather..." 
                                rows="3"
                                value={newSoapNote.assessment}
                                onChange={(e) => handleSoapInputChange('assessment', e.target.value)}
                              ></textarea>
                            </div>
                            <div className="form-group">
                              <label>Plan (What you'll do):</label>
                              <textarea 
                                placeholder="E.g., Monitor for 2 more days, then call vet if continues..." 
                                rows="3"
                                value={newSoapNote.plan}
                                onChange={(e) => handleSoapInputChange('plan', e.target.value)}
                              ></textarea>
                            </div>
                            <button className="btn-submit" onClick={handleSubmitSoapNote}>Save Note</button>
                          </div>
                          
                          <div className="saved-soap-notes">
                            <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Saved Notes</h4>
                            {soapNotes.length === 0 ? (
                              <p className="no-data">No personal notes yet. Start adding observations above!</p>
                            ) : (
                              soapNotes.map((note) => (
                                <div key={note.soap_id} className="soap-item">
                                  <strong>Date: {new Date(note.soap_date).toLocaleDateString('en-GB')}</strong>
                                  {note.subj && <p><strong>Subjective:</strong> {note.subj}</p>}
                                  {note.obj && <p><strong>Objective:</strong> {note.obj}</p>}
                                  {note.assess && <p><strong>Assessment:</strong> {note.assess}</p>}
                                  {note.plan && <p><strong>Plan:</strong> {note.plan}</p>}
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Tracking Tab */
                <div className="section-content tracking-dashboard">
                  <h3>Tracking & Monitoring</h3>
                  
                  {!activeTrackingView ? (
                    /* Tracking Dashboard - Main View */
                    <div className="dashboard-grid">
                      {/* Weight Tracking Card */}
                      <div className="dashboard-card large-card">
                        <div className="card-header-row">
                          <div className="card-header-left">
                            <Scale size={32} />
                            <h4>Weight Tracking</h4>
                          </div>
                        </div>
                        <div className="weight-chart">
                          {trackingData.weightLog.slice(0, 3).map((log, idx) => (
                            <div key={idx} className="weight-entry">
                              <span className="weight-value">{log.weight} kg</span>
                              <span className="weight-date">{new Date(log.rec_date).toLocaleDateString('en-GB')}</span>
                              {log.notes && <span className="weight-notes">{log.notes}</span>}
                            </div>
                          ))}
                          {trackingData.weightLog.length === 0 && <p className="no-data">No weight entries yet</p>}
                        </div>
                        <div className="card-actions">
                          <button className="btn-view-all" onClick={() => setActiveTrackingView('weight')}>
                            View All
                          </button>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('weight')}>
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                      </div>

                      {/* Activity Log Card */}
                      <div className="dashboard-card large-card">
                        <div className="card-header-row">
                          <div className="card-header-left">
                            <Activity size={32} />
                            <h4>Activity Log</h4>
                          </div>
                        </div>
                        <div className="activity-list">
                          {trackingData.activityLog.slice(0, 3).map((activity, idx) => (
                            <div key={idx} className="activity-entry">
                              <span className="activity-type">{activity.activ_type}</span>
                              <span className="activity-duration">{activity.duration_min} mins</span>
                              <span className="activity-date">{new Date(activity.activ_date).toLocaleDateString('en-GB')}</span>
                            </div>
                          ))}
                          {trackingData.activityLog.length === 0 && <p className="no-data">No activities logged yet</p>}
                        </div>
                        <div className="card-actions">
                          <button className="btn-view-all" onClick={() => setActiveTrackingView('activity')}>
                            View All
                          </button>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('activity')}>
                            <Plus size={16} /> Add Activity
                          </button>
                        </div>
                      </div>

                      {/* Symptom Diary Card */}
                      <div className="dashboard-card large-card">
                        <div className="card-header-row">
                          <div className="card-header-left">
                            <FileText size={32} />
                            <h4>Symptom Diary</h4>
                          </div>
                        </div>
                        
                        <div className="activity-list">
                          {trackingData.symptomLog.slice(0, 3).map((symptom, idx) => (
                            <div key={idx} className="activity-entry">
                              <span className="activity-type">{symptom.symp_title}</span>
                              <span className="activity-date">{new Date(symptom.symp_date).toLocaleDateString('en-GB')}</span>
                            </div>
                          ))}
                          {trackingData.symptomLog.length === 0 && <p className="no-data">No symptoms recorded recently</p>}
                        </div>
                        
                        <div className="card-actions">
                          <button className="btn-view-all" onClick={() => setActiveTrackingView('symptoms')}>
                            View All
                          </button>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('symptoms')}>
                            <Plus size={16} /> Add Entry
                          </button>
                        </div>
                      </div>


                      {/* Behavioral Notes Card */}
                      <div className="dashboard-card large-card">
                        <div className="card-header-row">
                          <div className="card-header-left">
                            <AlertCircle size={32} />
                            <h4>Behavioral Notes</h4>
                          </div>
                        </div>
                        <div className="behavior-list">
                          {trackingData.behaviorLog.slice(0, 3).map((behavior, idx) => (
                            <div key={idx} className="behavior-entry">
                              <span className="behavior-type">{behavior.behav_type}</span>
                              <span className="behavior-note">{behavior.behav_note}</span>
                              <span className="behavior-date">{new Date(behavior.behav_date).toLocaleDateString('en-GB')}</span>
                            </div>
                          ))}
                          {trackingData.behaviorLog.length === 0 && <p className="no-data">No behavioral notes yet</p>}
                        </div>
                        <div className="card-actions">
                          <button className="btn-view-all" onClick={() => setActiveTrackingView('behavior')}>
                            View All
                          </button>
                          <button className="btn-add-section" onClick={() => handleOpenTrackingModal('behavior')}>
                            <Plus size={16} /> Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Detailed Tracking View */
                    <div className="detailed-view">
                      <button className="back-to-dashboard" onClick={() => setActiveTrackingView(null)}>
                        ← Back to Dashboard
                      </button>

                      {/* Weight Tracking Full View */}
                      {activeTrackingView === 'weight' && (
                        <>
                          <div className="tracking-header">
                            <h3>Weight Tracking - All Entries</h3>
                            <button className="btn-add-section" onClick={() => handleOpenTrackingModal('weight')}>
                              <Plus size={16} /> Add Entry
                            </button>
                          </div>
                          <div className="weight-chart">
                            {trackingData.weightLog.map((log, idx) => (
                              <div key={idx} className="weight-entry">
                                <span className="weight-value">{log.weight} kg</span>
                                <span className="weight-date">{new Date(log.rec_date).toLocaleDateString('en-GB')}</span>
                                {log.notes && <span className="weight-notes">{log.notes}</span>}
                              </div>
                            ))}
                            {trackingData.weightLog.length === 0 && <p className="no-data">No weight entries yet</p>}
                          </div>
                        </>
                      )}

                      {/* Activity Log Full View */}
                      {activeTrackingView === 'activity' && (
                        <>
                          <div className="tracking-header">
                            <h3>Activity Log - All Entries</h3>
                            <button className="btn-add-section" onClick={() => handleOpenTrackingModal('activity')}>
                              <Plus size={16} /> Add Activity
                            </button>
                          </div>
                          <div className="activity-list">
                            {trackingData.activityLog.map((activity, idx) => (
                              <div key={idx} className="activity-entry">
                                <span className="activity-type">{activity.activ_type}</span>
                                <span className="activity-duration">{activity.duration_min} mins</span>
                                <span className="activity-date">{new Date(activity.activ_date).toLocaleDateString('en-GB')}</span>
                                {activity.notes && <span className="activity-notes">{activity.notes}</span>}
                              </div>
                            ))}
                            {trackingData.activityLog.length === 0 && <p className="no-data">No activities logged yet. Click "Add Activity" to start tracking.</p>}
                          </div>
                        </>
                      )}


                      {/* Symptom Diary Full View */}
                      {activeTrackingView === 'symptoms' && (
                        <>
                          <div className="tracking-header">
                            <h3>Symptom Diary - All Entries</h3>
                            <button className="btn-add-section" onClick={() => handleOpenTrackingModal('symptoms')}>
                              <Plus size={16} /> Add Entry
                            </button>
                          </div>
                          <div className="symptom-list">
                            {trackingData.symptomLog.map((symptom, idx) => (
                              <div key={idx} className="symptom-entry">
                                <div className="symptom-header">
                                  <span className="symptom-title">{symptom.symp_title}</span>
                                  <span className="symptom-date">{new Date(symptom.symp_date).toLocaleDateString('en-GB')}</span>
                                </div>
                                <p className="symptom-description">{symptom.symp_desc}</p>
                              </div>
                            ))}
                            {trackingData.symptomLog.length === 0 && <p className="no-data">No symptoms recorded yet. Click "Add Entry" to start tracking.</p>}
                          </div>
                        </>
                      )}


                      {/* Behavioral Notes Full View */}
                      {activeTrackingView === 'behavior' && (
                        <>
                          <div className="tracking-header">
                            <h3>Behavioral Notes - All Entries</h3>
                            <button className="btn-add-section" onClick={() => handleOpenTrackingModal('behavior')}>
                              <Plus size={16} /> Add Note
                            </button>
                          </div>
                          <div className="behavior-list">
                            {trackingData.behaviorLog.map((behavior, idx) => (
                              <div key={idx} className="behavior-entry">
                                <span className="behavior-type">{behavior.behav_type}</span>
                                <span className="behavior-note">{behavior.behav_note}</span>
                                <span className="behavior-date">{new Date(behavior.behav_date).toLocaleDateString('en-GB')}</span>
                              </div>
                            ))}
                            {trackingData.behaviorLog.length === 0 && <p className="no-data">No behavioral notes yet. Click "Add Note" to start tracking.</p>}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pet Info Sidebar - Only shown when NOT in detailed view */}
            {(!activeHealthView || activeTab === 'tracking') && (
              <div className="section-box pet-info-box">
                {/* Keep all existing pet info structure */}
                <div className="pet-info-image">
                {imagePreview ? (
                  <img src={imagePreview} alt={selectedPet.name} />
                ) : selectedPet.petImage ? (
                  <img src={`http://localhost:5000${selectedPet.petImage}`} alt={selectedPet.name} />
                ) : (
                  <PawPrint size={64} color="#888" />
                )}
                
                {isEditing && (
                  <div className="image-upload-controls">
                    <input
                      type="file"
                      id="pet-image-upload"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="pet-image-upload" className="btn-upload-image">
                      {selectedPet.petImage ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    
                    {(selectedImage || imagePreview) && (
                      <button className="btn-upload-confirm" onClick={handleImageUpload}>
                        Save Photo
                      </button>
                    )}
                    
                    {selectedPet.petImage && !selectedImage && (
                      <button className="btn-delete-image" onClick={handleImageDelete}>
                        Remove Photo
                      </button>
                    )}
                  </div>
                )}
              </div>
                <div className="pet-info-details">
                  {/* All existing info-row elements */}
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedPet.name}
                        onChange={(e) => setSelectedPet({ ...selectedPet, name: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.name}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Species:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedPet.species}
                        onChange={(e) => setSelectedPet({ ...selectedPet, species: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.species}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Breed:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedPet.breed}
                        onChange={(e) => setSelectedPet({ ...selectedPet, breed: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.breed}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Gender:</span>
                    {isEditing ? (
                      <select
                        value={selectedPet.gender}
                        onChange={(e) => setSelectedPet({ ...selectedPet, gender: e.target.value })}
                      >
                        <option value="m">Male</option>
                        <option value="f">Female</option>
                      </select>
                    ) : (
                      <span>{selectedPet.gender === 'm' ? 'Male' : selectedPet.gender === 'f' ? 'Female' : selectedPet.gender}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={selectedPet.age}
                        onChange={(e) => setSelectedPet({ ...selectedPet, age: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.age} years</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Weight:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={selectedPet.weight}
                        onChange={(e) => setSelectedPet({ ...selectedPet, weight: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.weight} kg</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Diet Type:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedPet.dietType}
                        onChange={(e) => setSelectedPet({ ...selectedPet, dietType: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.dietType || 'N/A'}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Behavioral Notes:</span>
                    {isEditing ? (
                      <textarea
                        rows="3"
                        value={selectedPet.behavioralNotes}
                        onChange={(e) => setSelectedPet({ ...selectedPet, behavioralNotes: e.target.value })}
                      />
                    ) : (
                      <span>{selectedPet.behavioralNotes || 'N/A'}</span>
                    )}
                  </div>

                  <div className="info-row">
                    <span className="info-label">Vaccination:</span>
                    {isEditing ? (
                      <select
                        value={selectedPet.hasVaccination}
                        onChange={(e) => setSelectedPet({ ...selectedPet, hasVaccination: e.target.value })}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span>{selectedPet.hasVaccination === 'yes' ? 'Yes' : 'No'}</span>
                    )}
                  </div>

                  {selectedPet.hasVaccination === 'yes' && (
                    <div className="info-row">
                      <span className="info-label">Vaccination Date:</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={selectedPet.vaccinationDate ? new Date(selectedPet.vaccinationDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setSelectedPet({ ...selectedPet, vaccinationDate: e.target.value })}
                        />
                      ) : (
                        <span>{selectedPet.vaccinationDate ? new Date(selectedPet.vaccinationDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                      )}
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">Medication:</span>
                    {isEditing ? (
                      <select
                        value={selectedPet.hasMedication}
                        onChange={(e) => setSelectedPet({ ...selectedPet, hasMedication: e.target.value })}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span>{selectedPet.hasMedication === 'yes' ? 'Yes' : 'No'}</span>
                    )}
                  </div>

                  {selectedPet.hasMedication === 'yes' && (
                    <div className="info-row">
                      <span className="info-label">Medication Details:</span>
                      {isEditing ? (
                        <textarea
                          rows="2"
                          value={selectedPet.medicationDetails || ''}
                          onChange={(e) => setSelectedPet({ ...selectedPet, medicationDetails: e.target.value })}
                        />
                      ) : (
                        <span>{selectedPet.medicationDetails || 'N/A'}</span>
                      )}
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">Allergies:</span>
                    {isEditing ? (
                      <select
                        value={selectedPet.hasAllergies}
                        onChange={(e) => setSelectedPet({ ...selectedPet, hasAllergies: e.target.value })}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span>{selectedPet.hasAllergies === 'yes' ? 'Yes' : 'No'}</span>
                    )}
                  </div>

                  {selectedPet.hasAllergies === 'yes' && (
                    <div className="info-row">
                      <span className="info-label">Allergy Details:</span>
                      {isEditing ? (
                        <textarea
                          rows="2"
                          value={selectedPet.allergyDetails || ''}
                          onChange={(e) => setSelectedPet({ ...selectedPet, allergyDetails: e.target.value })}
                        />
                      ) : (
                        <span>{selectedPet.allergyDetails || 'N/A'}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-delete"
                    onClick={() => handleDeletePet(selectedPet.id)}
                  >
                    <Trash2 size={18} /> Delete
                  </button>

                  {isEditing ? (
                    <>
                      <button className="btn-update" onClick={handleUpdatePet}>
                        Save Changes
                      </button>
                      <button className="btn-cancel" onClick={() => {
                        setIsEditing(false);
                        // Refresh pet data to discard changes
                        fetchPets();
                      }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn-update" onClick={() => setIsEditing(true)}>
                      Update
                    </button>
                  )}

                  <button className="btn-export" onClick={handleExportClick}>Export</button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Tracking Entry Modals */}
      {showTrackingModal && (
        <div className="modal-overlay" onClick={handleCloseTrackingModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {trackingModalType === 'weight' && 'Add Weight Entry'}
                {trackingModalType === 'activity' && 'Add Activity Entry'}
                {trackingModalType === 'symptoms' && 'Add Symptom Entry'}
                {trackingModalType === 'behavior' && 'Add Behavioral Note'}
              </h2>
              <button className="modal-close" onClick={handleCloseTrackingModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Weight Entry Form */}
              {trackingModalType === 'weight' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="0.0"
                      value={newTrackingEntry.weight}
                      onChange={(e) => handleTrackingInputChange('weight', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="E.g., After meal, morning weigh-in..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) => handleTrackingInputChange('notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Activity Entry Form */}
              {trackingModalType === 'activity' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Activity Type *</label>
                    <select
                      className="form-select"
                      value={newTrackingEntry.activityType}
                      onChange={(e) => handleTrackingInputChange('activityType', e.target.value)}
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

                  <div className="form-group">
                    <label className="form-label">Duration (minutes) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={newTrackingEntry.duration}
                      onChange={(e) => handleTrackingInputChange('duration', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="E.g., High energy, enjoyed the activity..."
                      rows="3"
                      value={newTrackingEntry.notes}
                      onChange={(e) => handleTrackingInputChange('notes', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Symptom Entry Form */}
              {trackingModalType === 'symptoms' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Symptom Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="E.g., Vomiting, Limping, Loss of appetite..."
                      value={newTrackingEntry.symptomTitle}
                      onChange={(e) => handleTrackingInputChange('symptomTitle', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe the symptom in detail..."
                      rows="4"
                      value={newTrackingEntry.symptomDescription}
                      onChange={(e) => handleTrackingInputChange('symptomDescription', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Behavioral Note Form */}
              {trackingModalType === 'behavior' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTrackingEntry.date}
                      onChange={(e) => handleTrackingInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Behavior Type *</label>
                    <select
                      className="form-select"
                      value={newTrackingEntry.behaviorType}
                      onChange={(e) => handleTrackingInputChange('behaviorType', e.target.value)}
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

                  <div className="form-group">
                    <label className="form-label">Behavioral Note *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe the behavior..."
                      rows="4"
                      value={newTrackingEntry.behaviorNote}
                      onChange={(e) => handleTrackingInputChange('behaviorNote', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button className="modal-button-cancel" onClick={handleCloseTrackingModal}>
                  Cancel
                </button>
                <button className="modal-button-save" onClick={handleSubmitTrackingEntry}>
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Export Pet Records</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="export-description">Select the data you want to export for {selectedPet?.name}</p>
              
              <div className="export-options">
                <label className="export-option">
                  <input
                    type="checkbox"
                    checked={exportOptions.petInfo}
                    onChange={() => handleExportOptionChange('petInfo')}
                  />
                  <span className="export-option-label">
                    <strong>Pet Information</strong>
                    <span className="export-option-description">
                      Basic info (name, species, breed, age, weight, diet, allergies, medications)
                    </span>
                  </span>
                </label>

                <label className="export-option">
                  <input
                    type="checkbox"
                    checked={exportOptions.healthRecords}
                    onChange={() => handleExportOptionChange('healthRecords')}
                  />
                  <span className="export-option-label">
                    <strong>Health Records</strong>
                    <span className="export-option-description">
                      Examinations, treatments, prescriptions, SOAP notes, vaccinations, conditions, surgeries
                    </span>
                  </span>
                </label>

                <label className="export-option">
                  <input
                    type="checkbox"
                    checked={exportOptions.trackingMonitoring}
                    onChange={() => handleExportOptionChange('trackingMonitoring')}
                  />
                  <span className="export-option-label">
                    <strong>Tracking & Monitoring</strong>
                    <span className="export-option-description">
                      Weight log, activity log, symptom diary, behavioral notes
                    </span>
                  </span>
                </label>
              </div>

              <div className="modal-actions">
                <button className="modal-button-cancel" onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
                <button 
                  className="modal-button-save" 
                  onClick={handleExportConfirm}
                  disabled={!exportOptions.petInfo && !exportOptions.healthRecords && !exportOptions.trackingMonitoring}
                >
                  Export as Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerMyPets;