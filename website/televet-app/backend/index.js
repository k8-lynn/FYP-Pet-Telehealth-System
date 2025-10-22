// televet-app/backend/index.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import haversine from 'haversine-distance';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Create HTTP server & Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ your actual Vite React app
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});


// ✅ Log connections
io.on('connection', (socket) => {
  console.log('🧩 A user connected:', socket.id);
  
  // Send a test event to confirm connection
  socket.emit('welcome', { message: 'Connected successfully!' });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ✅ Make io accessible inside routes
app.set('io', io);

// ✅ Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) console.error('❌ Database connection error:', err);
  else console.log('✅ Connected to MySQL DB');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// -------------------------------------------------------------
// 🟢 USER LOGIN
// -------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const sql = 'SELECT * FROM user_t WHERE usr_email = ? AND usr_password = ?';

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('❌ Login query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = result[0];

    // 🧾 Log the login event with all key details
    console.log("✅ Login successful for user:");
    console.log({
      usr_id: user.usr_id,
      usr_firstName: user.usr_firstName,
      usr_lastName: user.usr_lastName,
      usr_email: user.usr_email,
      usr_type: user.usr_type
    });

    res.status(200).json({
      message: 'Login successful',
      userId: user.usr_id,
      firstName: user.usr_firstName,
      lastName: user.usr_lastName,
      userType: user.usr_type
    });
  });
});


// -------------------------------------------------------------
// 🟢 FETCH PETS (by user ID)
// -------------------------------------------------------------
app.get('/api/pets/:usr_id', (req, res) => {
  const usr_id = req.params.usr_id;

  const sql = `
    SELECT p.pet_id, p.pet_name, p.pet_species, p.pet_breed, p.pet_age, p.pet_gender,
           p.pet_hasVaccination, p.pet_vaccinationDate, p.pet_hasMedication,
           p.pet_medicationDetails, p.pet_hasAllergies, p.pet_allergyDetails,
           p.pet_dietType, p.pet_weight, p.pet_behavioralNotes, p.pet_lastUpdated
    FROM pet_t p
    JOIN pet_parent_t pp ON p.pp_id = pp.pp_id
    WHERE pp.usr_id = ?
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Fetch pets error:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 REGISTER (Pet Parent or Vet Admin)
// -------------------------------------------------------------
app.post('/api/register', (req, res) => {
  console.log("🚀 Incoming /api/register request");

  if (!req.body) {
    console.error("❌ No body received in request");
    return res.status(400).json({ error: "Missing request body" });
  }

  console.log("🟢 Full request body:", req.body);

  const {
    firstName,
    lastName,
    email,
    password,
    userType
  } = req.body;

  // Quick validation
  if (!firstName || !lastName || !email || !password || !userType) {
    console.error("❌ Missing basic registration fields");
    return res.status(400).json({ error: "Incomplete registration data" });
  }

  console.log("📥 Attempting user_t insert for type:", userType);

  const sqlUser = `
    INSERT INTO user_t (usr_firstName, usr_lastName, usr_email, usr_password, usr_type)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sqlUser, [firstName, lastName, email, password, userType], (err, userResult) => {
    if (err) {
      console.error("❌ Error inserting into user_t:", err);
      return res.status(500).json({ error: "Failed to register user_t" });
    }

    const userId = userResult.insertId;
    console.log("✅ Inserted into user_t with usr_id =", userId);

    // 🧩 PET PARENT REGISTRATION
    if (userType === "petParent") {
      console.log("👩‍👧 Detected petParent registration");
    
      const sqlParent = `
      INSERT INTO pet_parent_t (usr_id, pp_lastUpdated, createdAt)
      VALUES (?, NOW(), NOW())
    `;

      db.query(sqlParent, [userId], (err2, parentResult) => {
        if (err2) {
          console.error("❌ Error inserting into pet_parent_t:", err2);
          return res.status(500).json({ error: "Failed to insert pet_parent_t" });
        }
    
        const pp_id = parentResult.insertId;
        console.log("✅ pet_parent_t inserted, pp_id =", pp_id);
    
        // 🐶 INSERT PET IMMEDIATELY
        const sqlPet = `
          INSERT INTO pet_t (
            pp_id, pet_name, pet_species, pet_breed, pet_age, pet_gender,
            pet_hasVaccination, pet_vaccinationDate,
            pet_hasMedication, pet_medicationDetails,
            pet_hasAllergies, pet_allergyDetails,
            pet_dietType, pet_weight, pet_behavioralNotes, pet_lastUpdated
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
    
        const values = [
          pp_id,
          req.body.petName,
          req.body.animalType,
          req.body.breed,
          req.body.age,
          req.body.gender,
          req.body.hasVaccination,
          req.body.vaccinationDate || null,
          req.body.hasMedication,
          req.body.medicationDetails || null,
          req.body.hasAllergies,
          req.body.allergies || null,
          req.body.dietType,
          req.body.weight,
          req.body.behavioralNotes
        ];
    
        db.query(sqlPet, values, (err3, petResult) => {
          if (err3) {
            console.error("❌ Error inserting pet_t:", err3);
            return res.status(500).json({ error: "Failed to insert pet_t" });
          }
    
          console.log("✅ Pet inserted successfully with pet_id =", petResult.insertId);
          return res.status(200).json({ message: "Pet parent and pet registered successfully!" });
        });
      });
    
    

    // 🧩 VET ADMIN REGISTRATION
    } else if (userType === "vetAdmin") {
      console.log("👨‍⚕️ Detected vetAdmin registration, preparing vet_admin_t insert...");

      const lat = req.body.va_lat || req.body.latitude || null;
      const lon = req.body.va_lon || req.body.longitude || null;


      const sqlVetAdmin = `
      INSERT INTO vet_admin_t (
        usr_id,
        va_licenseNumber,
        va_licensingAuthority,
        va_yearsOfPractice,
        va_specialization,
        va_vetLocation,
        va_clinicName,
        va_clinicPhone,
        va_clinicEmail,
        va_lat, 
        va_lon,
        va_consent,
        va_createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(sqlVetAdmin, [
      userId,
      req.body.licenseNumber,
      req.body.licensingAuthority,
      req.body.yearsOfPractice,
      req.body.specialization || null,
      req.body.vetLocation,
      req.body.clinicName,
      req.body.clinicPhone,
      req.body.clinicEmail,
      lat,
      lon,
      req.body.consent || 'yes'
    ], (errVet, vetResult) => {
      if (errVet) {
        console.error("❌ Error inserting into vet_admin_t:", errVet);
        return res.status(500).json({ error: "Failed to register vet admin" });
      }

      const va_id = vetResult.insertId;
      console.log("✅ vet_admin_t inserted successfully, va_id =", va_id);

      // 🏥 Automatically insert into clinic_t
      const sqlClinic = `
        INSERT INTO clinic_t (
          va_id,
          clinic_name,
          clinic_location,
          clinic_phone,
          clinic_email,
          clinic_lat,
          clinic_lon,
          clinic_status,
          clinic_rating,
          clinic_lastUpdated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 0.0, NOW())
      `;

      db.query(sqlClinic, [
        va_id,
        req.body.clinicName,
        req.body.vetLocation,
        req.body.clinicPhone,
        req.body.clinicEmail,
        lat,
        lon
      ], (errClinic) => {
        if (errClinic) {
          console.error("❌ Error inserting into clinic_t:", errClinic);
          return res.status(500).json({ error: "Vet admin created, but failed to create clinic record" });
        }

        console.log("✅ Clinic record successfully created for va_id =", va_id);
        return res.status(200).json({ message: "Vet admin and clinic registered successfully!" });
      });
    });
  } else {
      console.warn("⚠️ Unknown userType detected:", userType);
      return res.status(400).json({ error: "Invalid userType" });
    }
  });
});



// -------------------------------------------------------------
// 🟢 UPDATE PET
// -------------------------------------------------------------
app.put('/api/pets/:pet_id', (req, res) => {
  const { pet_id } = req.params;
  const updatedPet = req.body;

  const sql = `
    UPDATE pet_t SET
      pet_name = ?, pet_species = ?, pet_breed = ?, pet_age = ?, pet_gender = ?,
      pet_hasVaccination = ?, pet_vaccinationDate = ?, pet_hasMedication = ?, pet_medicationDetails = ?,
      pet_hasAllergies = ?, pet_allergyDetails = ?, pet_dietType = ?, pet_weight = ?, pet_behavioralNotes = ?, pet_lastUpdated = NOW()
    WHERE pet_id = ?
  `;

  db.query(sql, [
    updatedPet.pet_name,
    updatedPet.pet_species,
    updatedPet.pet_breed,
    updatedPet.pet_age,
    updatedPet.pet_gender,
    updatedPet.pet_hasVaccination,
    updatedPet.pet_vaccinationDate || null,
    updatedPet.pet_hasMedication,
    updatedPet.pet_medicationDetails,
    updatedPet.pet_hasAllergies,
    updatedPet.pet_allergyDetails,
    updatedPet.pet_dietType,
    updatedPet.pet_weight,
    updatedPet.pet_behavioralNotes,
    pet_id
  ], (err, result) => {
    if (err) {
      console.error('❌ Error updating pet:', err);
      return res.status(500).json({ error: 'Failed to update pet' });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Pet not found' });

    res.status(200).json({ message: 'Pet updated successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 ADD PET (for existing pet parent)
// -------------------------------------------------------------
app.post('/api/add-pet', (req, res) => {
  const {
    userId,
    petName,
    animalType,
    breed,
    age,
    gender,
    hasVaccination,
    vaccinationDate,
    hasMedication,
    medicationDetails,
    hasAllergies,
    allergies,
    dietType,
    weight,
    behavioralNotes
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Find the pet parent ID (pp_id) linked to this user
  const findParentSQL = "SELECT pp_id FROM pet_parent_t WHERE usr_id = ?";
  db.query(findParentSQL, [userId], (err, parentResult) => {
    if (err) {
      console.error("❌ Error finding pet parent:", err);
      return res.status(500).json({ error: "Database error while finding pet parent" });
    }

    if (parentResult.length === 0) {
      return res.status(404).json({ error: "Pet parent not found for this user" });
    }

    const pp_id = parentResult[0].pp_id;

    const insertPetSQL = `
      INSERT INTO pet_t (
        pp_id, pet_name, pet_species, pet_breed, pet_age, pet_gender,
        pet_hasVaccination, pet_vaccinationDate,
        pet_hasMedication, pet_medicationDetails,
        pet_hasAllergies, pet_allergyDetails,
        pet_dietType, pet_weight, pet_behavioralNotes, pet_lastUpdated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      pp_id,
      petName || null,
      animalType || null,
      breed || null,
      age || null,
      gender || null,
      hasVaccination || 'no',
      vaccinationDate || null,
      hasMedication || 'no',
      medicationDetails || null,
      hasAllergies || 'no',
      allergies || null,
      dietType || null,
      weight || null,
      behavioralNotes || null
    ];


    db.query(insertPetSQL, values, (err2, result) => {
      if (err2) {
        console.error("❌ Error inserting pet:", err2);
        return res.status(500).json({ error: "Failed to add pet" });
      }

      return res.status(200).json({ message: "✅ Pet added successfully!" });
    });
  });
});


// -------------------------------------------------------------
// 🟢 DELETE PET
// -------------------------------------------------------------
app.delete('/api/pets/:pet_id', (req, res) => {
  const { pet_id } = req.params;
  const sql = 'DELETE FROM pet_t WHERE pet_id = ?';

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting pet:', err);
      return res.status(500).json({ error: 'Failed to delete pet' });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Pet not found' });

    res.status(200).json({ message: 'Pet deleted successfully' });
  });
});

// -------------------------------------------------------------
app.get('/', (req, res) => res.send('🐾 Server is running...'));
app.listen(process.env.PORT || 8080, () => console.log(`🚀 Server on port ${process.env.PORT}`));

// Add these endpoints to your backend/index.js
// 🟢 GET all veterinarians for a specific vet admin (by va_id)
app.get('/api/veterinarians/:va_id', (req, res) => {
  const { va_id } = req.params;

  console.log("🐾 GET veterinarians for va_id =", va_id);

  const sql = `
    SELECT 
      vt.vt_id, 
      vt.vt_licenseNumber, 
      vt.vt_licensingAuthority, 
      vt.vt_yearsOfPractice,
      vt.vt_specialization, 
      vt.vt_vetLocation, 
      vt.vt_clinicName, 
      vt.vt_clinicPhone, 
      vt.vt_clinicEmail,
      vt.vt_patientsAssigned,
      vt.vt_onDutyToday,
      vt.vt_createdAt,
      u.usr_firstName, 
      u.usr_lastName, 
      u.usr_email
    FROM veterinarian_t vt
    JOIN user_t u ON vt.usr_id = u.usr_id
    WHERE vt.va_id = ?
  `;

  db.query(sql, [va_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching veterinarians:', err);
      return res.status(500).json({ error: 'Failed to fetch veterinarians' });
    }

    console.log(`✅ Retrieved ${result.length} veterinarians for va_id ${va_id}`);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 GET USER PROFILE (Pet Parent or Vet Admin)
// -------------------------------------------------------------
app.get('/api/profile/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  // Step 1️⃣: Get base user info
  const userSQL = `
    SELECT usr_id, usr_firstName, usr_lastName, usr_email, usr_password, usr_type 
    FROM user_t 
    WHERE usr_id = ?
  `;
  
  db.query(userSQL, [usr_id], (err, userResult) => {
    if (err) {
      console.error('❌ Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    if (userResult.length === 0) {
      console.warn('⚠️ No user found for usr_id:', usr_id);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Step 2️⃣: If Pet Parent
    if (user.usr_type === 'petParent') {
      const parentSQL = `
        SELECT pp_id, pp_assignedClinic, pp_reminder, pp_lastUpdated, pp_schedule, createdAt
        FROM pet_parent_t
        WHERE usr_id = ?
      `;
      
      db.query(parentSQL, [usr_id], (err2, parentResult) => {
        if (err2) {
          console.error('❌ Error fetching pet parent:', err2);
          return res.status(500).json({ error: 'Failed to fetch pet parent data' });
        }

        if (parentResult.length === 0) {
          console.warn('⚠️ No pet parent data found for usr_id:', usr_id);
          return res.status(404).json({ error: 'Pet parent data not found' });
        }

        res.status(200).json({
          ...user,
          ...parentResult[0]
        });
      });
    } 
    
    // Step 3️⃣: If Vet Admin
    else if (user.usr_type === 'vetAdmin') {
      const vetSQL = `
        SELECT 
          v.va_id, 
          v.va_licenseNumber, 
          v.va_licensingAuthority, 
          v.va_yearsOfPractice, 
          v.va_specialization, 
          v.va_vetLocation, 
          v.va_clinicName, 
          v.va_clinicPhone, 
          v.va_clinicEmail, 
          va_lat,
          va_lon,
          v.va_consent, 
          v.va_createdAt
        FROM vet_admin_t v
        WHERE v.usr_id = ?
      `;
      
      db.query(vetSQL, [usr_id], (err2, vetResult) => {
        if (err2) {
          console.error('❌ Error fetching vet admin:', err2);
          return res.status(500).json({ error: 'Failed to fetch vet admin data' });
        }

        if (vetResult.length === 0) {
          console.warn('⚠️ No vet admin data found for usr_id:', usr_id);
          return res.status(404).json({ error: 'Vet admin data not found' });
        }

        const profile = { ...user, ...vetResult[0] };
        console.log("✅ Sending Vet Admin Profile:", profile);

        res.status(200).json(profile);
      });
    } 
    
    // Step 4️⃣: Invalid user type
    else {
      console.error('⚠️ Invalid user type:', user.usr_type);
      return res.status(400).json({ error: 'Invalid user type' });
    }
  });
});




// -------------------------------------------------------------
// 🟢 UPDATE USER PROFILE (Pet Parent)
// -------------------------------------------------------------
app.put('/api/profile/petparent/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  const { usr_firstName, usr_lastName, usr_email, usr_password } = req.body;

  // Update user_t table
  const updateUserSQL = `
    UPDATE user_t 
    SET usr_firstName = ?, usr_lastName = ?, usr_email = ?, usr_password = ?
    WHERE usr_id = ?
  `;

  db.query(updateUserSQL, [usr_firstName, usr_lastName, usr_email, usr_password, usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update pet_parent_t lastUpdated
    const updateParentSQL = 'UPDATE pet_parent_t SET pp_lastUpdated = NOW() WHERE usr_id = ?';
    db.query(updateParentSQL, [usr_id], (err2) => {
      if (err2) {
        console.error('❌ Error updating pet parent timestamp:', err2);
      }
      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
});



// -------------------------------------------------------------
// 🟢 REGISTER NEW VETERINARIAN
// -------------------------------------------------------------
app.post('/api/veterinarians', (req, res) => {
  console.log("🚀 Incoming /api/veterinarians POST request");
  console.log("🟢 Request body:", req.body);

  const {
    firstName,
    lastName,
    email,
    password,
    licenseNumber,
    licensingAuthority,
    yearsOfPractice,
    specialization,
    va_id
  } = req.body;

  // ✅ Step 0: Validate required fields
  if (
    !firstName || !lastName || !email || !password ||
    !licenseNumber || !licensingAuthority || !yearsOfPractice || !va_id
  ) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✅ Step 1: Get clinic info from the vet admin (auto-fill)
  const sqlGetAdmin = `
    SELECT va_vetLocation, va_clinicName, va_clinicPhone, va_clinicEmail
    FROM vet_admin_t
    WHERE va_id = ?
  `;

  db.query(sqlGetAdmin, [va_id], (err, adminResult) => {
    if (err) {
      console.error("❌ Error fetching vet admin info:", err);
      return res.status(500).json({ error: "Failed to fetch vet admin info" });
    }
    if (adminResult.length === 0) {
      console.error("❌ Vet admin not found");
      return res.status(404).json({ error: "Vet admin not found" });
    }

    const { va_vetLocation, va_clinicName, va_clinicPhone, va_clinicEmail } = adminResult[0];

    // ✅ Step 2: Insert into user_t (account for veterinarian)
    const sqlUser = `
      INSERT INTO user_t (usr_firstName, usr_lastName, usr_email, usr_password, usr_type)
      VALUES (?, ?, ?, ?, 'veterinarian')
    `;

    db.query(sqlUser, [firstName, lastName, email, password], (err, userResult) => {
      if (err) {
        console.error("❌ Error inserting into user_t:", err);
        return res.status(500).json({ error: "Failed to create user" });
      }

      const usr_id = userResult.insertId;

      // ✅ Step 3: Insert into veterinarian_t
      const sqlVet = `
        INSERT INTO veterinarian_t (
          usr_id, va_id,
          vt_licenseNumber, vt_licensingAuthority, vt_yearsOfPractice, vt_specialization,
          vt_vetLocation, vt_clinicName, vt_clinicPhone, vt_clinicEmail, vt_consent
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'yes')
      `;

      db.query(
        sqlVet,
        [
          usr_id,
          va_id,
          licenseNumber,
          licensingAuthority,
          yearsOfPractice,
          specialization || null,
          va_vetLocation,
          va_clinicName,
          va_clinicPhone,
          va_clinicEmail
        ],
        (err, vetResult) => {
          if (err) {
            console.error("❌ Error inserting into veterinarian_t:", err);
            return res.status(500).json({ error: "Failed to create veterinarian record" });
          }

          console.log("✅ Veterinarian successfully created:", {
            usr_id,
            vt_id: vetResult.insertId,
          });

          res.status(201).json({
            message: "Veterinarian successfully registered",
            veterinarian: {
              vt_id: vetResult.insertId,
              usr_id,
              firstName,
              lastName,
              email,
              licenseNumber,
              licensingAuthority,
              yearsOfPractice,
              specialization,
              clinic: {
                name: va_clinicName,
                location: va_vetLocation,
                phone: va_clinicPhone,
                email: va_clinicEmail
              }
            }
          });
        }
      );
    });
  });
});


// -------------------------------------------------------------
// 🟢 UPDATE USER PROFILE (Vet Admin)
// -------------------------------------------------------------
app.put('/api/profile/vetadmin/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  const {
    usr_firstName,
    usr_lastName,
    usr_email,
    usr_password,
    va_licenseNumber,
    va_licensingAuthority,
    va_yearsOfPractice,
    va_specialization,
    va_vetLocation,
    va_clinicName,
    va_clinicPhone,
    va_clinicEmail
  } = req.body;

  // Update user_t table
  const updateUserSQL = `
    UPDATE user_t 
    SET usr_firstName = ?, usr_lastName = ?, usr_email = ?, usr_password = ?
    WHERE usr_id = ?
  `;

  db.query(updateUserSQL, [usr_firstName, usr_lastName, usr_email, usr_password, usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update vet_admin_t table
    const updateVetSQL = `
      UPDATE vet_admin_t 
      SET va_licenseNumber = ?, va_licensingAuthority = ?, va_yearsOfPractice = ?,
          va_specialization = ?, va_vetLocation = ?, va_clinicName = ?,
          va_clinicPhone = ?, va_clinicEmail = ?
      WHERE usr_id = ?
    `;

    db.query(updateVetSQL, [
      va_licenseNumber,
      va_licensingAuthority,
      va_yearsOfPractice,
      va_specialization,
      va_vetLocation,
      va_clinicName,
      va_clinicPhone,
      va_clinicEmail,
      usr_id
    ], (err2, vetResult) => {
      if (err2) {
        console.error('❌ Error updating vet admin:', err2);
        return res.status(500).json({ error: 'Failed to update vet admin data' });
      }

      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
});

app.get("/api/vets-nearby", (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  const sql = `
    SELECT va_id, va_clinicName, va_vetLocation, va_clinicPhone, va_clinicEmail, va_lat, va_lon
    FROM vet_admin_t
    WHERE va_lat IS NOT NULL AND va_lon IS NOT NULL
  `;

  db.query(sql, (err, vets) => {
    if (err) return res.status(500).json({ error: "DB error" });

    if (!vets || vets.length === 0) {
      return res.status(404).json({ message: "No vets found in the database." });
    }

    const withDistances = vets.map(vet => {
      const distance = haversine(
        { lat: parseFloat(lat), lon: parseFloat(lon) },
        { lat: vet.va_lat, lon: vet.va_lon }
      );
      return { ...vet, distance: distance / 1000 }; // meters → km
    });

    const sorted = withDistances.sort((a, b) => a.distance - b.distance);

    res.json(sorted.slice(0, 10));
  });
});

//BACKEND
// 🟢 ASSIGN PET PARENT TO A CLINIC 
app.put('/api/assign-clinic', (req, res) => {
  const { usr_id, clinicName } = req.body;

  if (!usr_id || !clinicName) {
    return res.status(400).json({ error: "Missing usr_id or clinicName" });
  }

  const sql = `
    UPDATE pet_parent_t
    SET pp_assignedClinic = ?, pp_lastUpdated = NOW()
    WHERE usr_id = ?
  `;

  db.query(sql, [clinicName, usr_id], (err, result) => {
    if (err) {
      console.error("❌ Error assigning clinic:", err);
      return res.status(500).json({ error: "Failed to assign clinic" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pet parent not found" });
    }

    console.log(`✅ Pet parent ${usr_id} assigned to clinic ${clinicName}`);
    res.status(200).json({ message: "✅ Successfully registered into clinic!" });
  });
});

// GET /api/user-clinic/:usr_id
app.get("/api/user-clinic/:usr_id", (req, res) => {
  const { usr_id } = req.params;

  db.query(
    "SELECT pp_assignedClinic FROM pet_parent_t WHERE usr_id = ?",
    [usr_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0 || !result[0].pp_assignedClinic) {
        return res.json({ clinic: null });
      }

      res.json({ clinic: result[0].pp_assignedClinic });
    }
  );
});

// GET /api/vet-by-name/:name
// GET /api/vet-by-name/:name
app.get("/api/vet-by-name/:name", (req, res) => {
  const { name } = req.params;

  const sql = `
    SELECT 
      va.va_id,
      va.va_clinicName,
      va.va_vetLocation,
      va.va_clinicPhone,
      va.va_clinicEmail,
      va.va_lat,
      va.va_lon,
      c.clinic_id
    FROM vet_admin_t va
    INNER JOIN clinic_t c ON va.va_id = c.va_id  -- Changed from LEFT JOIN to INNER JOIN
    WHERE va.va_clinicName = ? 
    LIMIT 1
  `;

  db.query(sql, [name], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      console.warn(`⚠️ Vet not found for clinic name: ${name}`);
      return res.status(404).json({ error: "Vet not found" });
    }

    res.json(result[0]);
  });
});


// Add these endpoints to your backend/index.js file
// Add these endpoints to your backend/index.js file
// Add these endpoints to your backend/index.js file

// -------------------------------------------------------------
// 🟢 GET CLINIC INFO BY VET ADMIN ID
// -------------------------------------------------------------
app.get('/api/clinic/:va_id', (req, res) => {
  const { va_id } = req.params;

  const sql = `
    SELECT 
      clinic_id, 
      va_id, 
      clinic_name, 
      clinic_location, 
      clinic_phone, 
      clinic_email,
      clinic_lat,
      clinic_lon,
      clinic_openingHours,
      clinic_daysOpen,
      clinic_availableSlots,
      clinic_totalCapacity,
      clinic_currentPatients,
      clinic_status,
      clinic_rating,
      clinic_lastUpdated
    FROM clinic_t
    WHERE va_id = ?
  `;

  db.query(sql, [va_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic data' });
    }

    if (result.length === 0) {
      console.warn('⚠️ No clinic found for va_id:', va_id);
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log('✅ Clinic data retrieved for va_id:', va_id);
    res.status(200).json(result[0]);
  });
});



// -------------------------------------------------------------
// 🟢 GET CLINIC HOURS BY CLINIC ID
// -------------------------------------------------------------
app.get('/api/clinic-hours/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const sql = `
    SELECT 
      clinic_hours_id,
      clinic_id,
      monday_hours,
      tuesday_hours,
      wednesday_hours,
      thursday_hours,
      friday_hours,
      saturday_hours,
      sunday_hours,
      last_updated
    FROM clinic_hours_t
    WHERE clinic_id = ?
  `;

  db.query(sql, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic hours:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic hours' });
    }

    if (result.length === 0) {
      console.log('⚠️ No clinic hours found for clinic_id:', clinic_id);
      return res.status(200).json(null);
    }

    // Parse JSON strings in the response
    const hoursData = result[0];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    daysOfWeek.forEach(day => {
      const field = `${day}_hours`;
      if (hoursData[field]) {
        try {
          // Already parsed by MySQL if it's an object, otherwise parse it
          if (typeof hoursData[field] === 'string') {
            hoursData[field] = JSON.parse(hoursData[field]);
          }
        } catch (e) {
          console.warn(`⚠️ Could not parse ${field}:`, hoursData[field]);
        }
      }
    });

    console.log('✅ Clinic hours retrieved for clinic_id:', clinic_id);
    res.status(200).json(hoursData);
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE OR CREATE CLINIC HOURS
// -------------------------------------------------------------
// 🟢 UPDATE OR CREATE CLINIC HOURS (with Socket.IO real-time emit)
app.put('/api/clinic-hours/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const io = req.app.get('io'); // ✅ Socket.IO instance
  const {
    monday_hours,
    tuesday_hours,
    wednesday_hours,
    thursday_hours,
    friday_hours,
    saturday_hours,
    sunday_hours
  } = req.body;

  const checkSQL = 'SELECT clinic_hours_id FROM clinic_hours_t WHERE clinic_id = ?';

  db.query(checkSQL, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error checking clinic hours:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // 🆕 CASE 1: No existing hours → INSERT
    if (result.length === 0) {
      const insertSQL = `
        INSERT INTO clinic_hours_t (
          clinic_id,
          monday_hours,
          tuesday_hours,
          wednesday_hours,
          thursday_hours,
          friday_hours,
          saturday_hours,
          sunday_hours
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertSQL, [
        clinic_id,
        monday_hours || null,
        tuesday_hours || null,
        wednesday_hours || null,
        thursday_hours || null,
        friday_hours || null,
        saturday_hours || null,
        sunday_hours || null
      ], (err2) => {
        if (err2) {
          console.error('❌ Error inserting clinic hours:', err2);
          return res.status(500).json({ error: 'Failed to create clinic hours' });
        }

        console.log('✅ Clinic hours created for clinic_id:', clinic_id);

        // ✅ Emit to all clients (real-time update)
        io.emit('clinicHoursUpdated', {
          clinic_id: parseInt(clinic_id),
          action: 'created',
          hours: {
            monday_hours,
            tuesday_hours,
            wednesday_hours,
            thursday_hours,
            friday_hours,
            saturday_hours,
            sunday_hours
          },
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({ message: 'Clinic hours created successfully' });
      });

    // 📝 CASE 2: Already exists → UPDATE
    } else {
      const updateSQL = `
        UPDATE clinic_hours_t
        SET 
          monday_hours = ?,
          tuesday_hours = ?,
          wednesday_hours = ?,
          thursday_hours = ?,
          friday_hours = ?,
          saturday_hours = ?,
          sunday_hours = ?,
          last_updated = NOW()
        WHERE clinic_id = ?
      `;

      db.query(updateSQL, [
        monday_hours || null,
        tuesday_hours || null,
        wednesday_hours || null,
        thursday_hours || null,
        friday_hours || null,
        saturday_hours || null,
        sunday_hours || null,
        clinic_id
      ], (err2) => {
        if (err2) {
          console.error('❌ Error updating clinic hours:', err2);
          return res.status(500).json({ error: 'Failed to update clinic hours' });
        }

        console.log('✅ Clinic hours updated for clinic_id:', clinic_id);

        // ✅ FETCH THE COMPLETE UPDATED DATA
        const fetchSQL = 'SELECT * FROM clinic_hours_t WHERE clinic_id = ?';
        db.query(fetchSQL, [clinic_id], (err3, fetchResult) => {
          if (err3 || fetchResult.length === 0) {
            console.error('❌ Error fetching updated hours:', err3);
            return res.status(200).json({ message: 'Clinic hours updated successfully' });
          }

          const updatedHours = fetchResult[0];
          
          // Parse JSON strings before emitting
          const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          daysOfWeek.forEach(day => {
            const field = `${day}_hours`;
            if (updatedHours[field] && typeof updatedHours[field] === 'string') {
              try {
                updatedHours[field] = JSON.parse(updatedHours[field]);
              } catch (e) {
                updatedHours[field] = null;
              }
            }
          });

          // ✅ Emit COMPLETE data
          io.emit('clinicHoursUpdated', {
            clinic_id: parseInt(clinic_id),
            action: 'updated',
            hours: updatedHours, // Send the FULL object
            timestamp: new Date().toISOString()
          });

          return res.status(200).json({ message: 'Clinic hours updated successfully' });
        });
      });
    }
  });
});

// -------------------------------------------------------------
// 🟢 GET CLINIC STATUS BY CLINIC ID
// -------------------------------------------------------------
app.get('/api/clinic-status/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const sql = `
    SELECT 
      clinic_id,
      clinic_status,
      clinic_lastUpdated
    FROM clinic_t
    WHERE clinic_id = ?
  `;

  db.query(sql, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic status:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic status' });
    }

    if (result.length === 0) {
      console.log('⚠️ No clinic found for clinic_id:', clinic_id);
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log('✅ Clinic status retrieved for clinic_id:', clinic_id);
    res.status(200).json({
      clinic_id: result[0].clinic_id,
      status: result[0].clinic_status,
      lastUpdated: result[0].clinic_lastUpdated
    });
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE CLINIC STATUS (WITH SOCKET.IO EMIT)
// -------------------------------------------------------------
app.put('/api/clinic-status/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const { status } = req.body;
  const io = req.app.get('io'); // Get io instance

  if (!status || !['open', 'closed', 'temporarily closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = `
    UPDATE clinic_t
    SET clinic_status = ?, clinic_lastUpdated = NOW()
    WHERE clinic_id = ?
  `;

  db.query(sql, [status, clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating clinic status:', err);
      return res.status(500).json({ error: 'Failed to update clinic status' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log(`✅ Clinic status updated to ${status} for clinic_id:`, clinic_id);
    
    // 🔔 Emit Socket.IO event to all connected clients
    io.emit('clinicStatusUpdated', { 
      clinic_id: parseInt(clinic_id), 
      status,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ message: 'Clinic status updated successfully', status });
  });
});
//BACKEND
// -------------------------------------------------------------
// 🟢 GET CLINIC SLOTS BY CLINIC ID
// -------------------------------------------------------------
app.get('/api/clinic-slots/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const sql = `
    SELECT 
      clinic_slots_id,
      clinic_id,
      slots,
      last_updated
    FROM clinic_slots_t
    WHERE clinic_id = ?
  `;

  db.query(sql, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic slots:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic slots' });
    }

    if (result.length === 0) {
      console.log('⚠️ No clinic slots found for clinic_id:', clinic_id);
      return res.status(200).json(null);
    }

    const slotsData = result[0];
    
    // Parse JSON if it's a string
    if (slotsData.slots && typeof slotsData.slots === 'string') {
      try {
        slotsData.slots = JSON.parse(slotsData.slots);
      } catch (e) {
        console.warn('⚠️ Could not parse slots:', slotsData.slots);
      }
    }

    console.log('✅ Clinic slots retrieved for clinic_id:', clinic_id);
    res.status(200).json(slotsData);
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE OR CREATE CLINIC SLOTS
// -------------------------------------------------------------
app.put('/api/clinic-slots/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const { slots } = req.body;

  if (!slots) {
    return res.status(400).json({ error: 'Slots data is required' });
  }

  // Convert slots array to JSON string
  const slotsJSON = JSON.stringify(slots);

  // Check if slots already exist
  const checkSQL = 'SELECT clinic_slots_id FROM clinic_slots_t WHERE clinic_id = ?';

  db.query(checkSQL, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error checking clinic slots:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      // INSERT new clinic slots
      const insertSQL = `
        INSERT INTO clinic_slots_t (clinic_id, slots)
        VALUES (?, ?)
      `;

      db.query(insertSQL, [clinic_id, slotsJSON], (err2) => {
        if (err2) {
          console.error('❌ Error inserting clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to create clinic slots' });
        }

        console.log('✅ Clinic slots created for clinic_id:', clinic_id);
        res.status(200).json({ message: 'Clinic slots created successfully' });
      });
    } else {
      // UPDATE existing clinic slots
      const updateSQL = `
        UPDATE clinic_slots_t
        SET slots = ?, last_updated = NOW()
        WHERE clinic_id = ?
      `;

      db.query(updateSQL, [slotsJSON, clinic_id], (err2) => {
        if (err2) {
          console.error('❌ Error updating clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to update clinic slots' });
        }

        console.log('✅ Clinic slots updated for clinic_id:', clinic_id);
        res.status(200).json({ message: 'Clinic slots updated successfully' });
      });
    }
  });
});
// -------------------------------------------------------------
// 🟢 GENERATE DEFAULT SLOTS FROM CLINIC HOURS
// -------------------------------------------------------------
app.post('/api/clinic-slots/generate/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  // First, get clinic hours
  const hoursSQL = 'SELECT * FROM clinic_hours_t WHERE clinic_id = ?';
  
  db.query(hoursSQL, [clinic_id], (err, hoursResult) => {
    if (err) {
      console.error('❌ Error fetching clinic hours:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic hours' });
    }

    if (hoursResult.length === 0) {
      return res.status(404).json({ error: 'Clinic hours not found. Please set clinic hours first.' });
    }

    const hoursData = hoursResult[0];
    
    // Get today's day of week
    const today = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = daysOfWeek[today.getDay()];
    
    const todayHoursField = `${todayName}_hours`;
    let todayHours = hoursData[todayHoursField];

    // Parse if it's a string
    if (typeof todayHours === 'string') {
      try {
        todayHours = JSON.parse(todayHours);
      } catch (e) {
        todayHours = null;
      }
    }

    if (!todayHours || todayHours.status === 'Closed' || !todayHours.opening || !todayHours.closing) {
      return res.status(400).json({ error: 'Clinic is closed today or hours not set' });
    }

    // Generate time slots
    const slots = generateTimeSlots(todayHours.opening, todayHours.closing);
    
    // Save to database
    const slotsJSON = JSON.stringify(slots);
    const checkSQL = 'SELECT clinic_slots_id FROM clinic_slots_t WHERE clinic_id = ?';

    db.query(checkSQL, [clinic_id], (err2, checkResult) => {
      if (err2) {
        console.error('❌ Error checking clinic slots:', err2);
        return res.status(500).json({ error: 'Database error' });
      }

      if (checkResult.length === 0) {
        // INSERT
        const insertSQL = 'INSERT INTO clinic_slots_t (clinic_id, slots) VALUES (?, ?)';
        db.query(insertSQL, [clinic_id, slotsJSON], (err3) => {
          if (err3) {
            console.error('❌ Error inserting slots:', err3);
            return res.status(500).json({ error: 'Failed to create slots' });
          }
          console.log('✅ Default slots generated for clinic_id:', clinic_id);
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      } else {
        // UPDATE
        const updateSQL = 'UPDATE clinic_slots_t SET slots = ?, last_updated = NOW() WHERE clinic_id = ?';
        db.query(updateSQL, [slotsJSON, clinic_id], (err3) => {
          if (err3) {
            console.error('❌ Error updating slots:', err3);
            return res.status(500).json({ error: 'Failed to update slots' });
          }
          console.log('✅ Default slots updated for clinic_id:', clinic_id);
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      }
    });
  });
});

// Helper function to generate time slots
function generateTimeSlots(openingTime, closingTime) {
  const slots = [];
  let slotId = 1;

  // Convert time to 24-hour format for comparison
  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes; // Return minutes from midnight
  };

  const formatTime = (minutes) => {
    let hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
  };

  const startMinutes = parseTime(openingTime);
  const endMinutes = parseTime(closingTime);
  const interval = 30; // 30-minute intervals

  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    slots.push({
      id: slotId++,
      time: formatTime(minutes),
      status: 'available',
      patient: null
    });
  }

  return slots;
}

// GET /api/clinic-slots/:clinic_id/date/:date
app.get('/api/clinic-slots/:clinic_id/date/:date', (req, res) => {
  const { clinic_id, date } = req.params;

  const sql = `
    SELECT 
      clinic_slots_id,
      clinic_id,
      slot_date,
      slots,
      last_updated
    FROM clinic_slots_t
    WHERE clinic_id = ? AND slot_date = ?
  `;

  db.query(sql, [clinic_id, date], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic slots by date:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic slots' });
    }

    if (result.length === 0) {
      console.log('⚠️ No clinic slots found for date:', date);
      return res.status(200).json({ slots: [] });
    }

    const slotsData = result[0];
    
    // Parse JSON if it's a string
    if (slotsData.slots && typeof slotsData.slots === 'string') {
      try {
        slotsData.slots = JSON.parse(slotsData.slots);
      } catch (e) {
        console.warn('⚠️ Could not parse slots:', slotsData.slots);
      }
    }

    console.log('✅ Clinic slots retrieved for date:', date);
    res.status(200).json(slotsData);
  });
});

// PUT /api/clinic-slots/:clinic_id/date/:date
app.put('/api/clinic-slots/:clinic_id/date/:date', (req, res) => {
  const { clinic_id, date } = req.params;
  const { slots } = req.body;
  const io = req.app.get('io'); // ✅ Get io instance

  if (!slots) {
    return res.status(400).json({ error: 'Slots data is required' });
  }

  const slotsJSON = JSON.stringify(slots);

  const checkSQL = 'SELECT clinic_slots_id FROM clinic_slots_t WHERE clinic_id = ? AND slot_date = ?';

  db.query(checkSQL, [clinic_id, date], (err, result) => {
    if (err) {
      console.error('❌ Error checking clinic slots:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      const insertSQL = `
        INSERT INTO clinic_slots_t (clinic_id, slot_date, slots)
        VALUES (?, ?, ?)
      `;

      db.query(insertSQL, [clinic_id, date, slotsJSON], (err2) => {
        if (err2) {
          console.error('❌ Error inserting clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to create clinic slots' });
        }

        console.log('✅ Clinic slots created for date:', date);

        // 🟢 Emit Socket.IO event
        io.emit('slotUpdated', { clinic_id, date, action: 'created' });

        res.status(200).json({ message: 'Clinic slots created successfully' });
      });
    } else {
      const updateSQL = `
        UPDATE clinic_slots_t
        SET slots = ?, last_updated = NOW()
        WHERE clinic_id = ? AND slot_date = ?
      `;

      db.query(updateSQL, [slotsJSON, clinic_id, date], (err2) => {
        if (err2) {
          console.error('❌ Error updating clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to update clinic slots' });
        }

        console.log('✅ Clinic slots updated for date:', date);

        // 🟢 Emit Socket.IO event
        io.emit('slotUpdated', { clinic_id, date, action: 'updated' });

        res.status(200).json({ message: 'Clinic slots updated successfully' });
      });
    }
  });
});


// GET /api/clinic-slots/:clinic_id/range
app.get('/api/clinic-slots/:clinic_id/range', (req, res) => {
  const { clinic_id } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const sql = `
    SELECT 
      slot_date,
      slots
    FROM clinic_slots_t
    WHERE clinic_id = ? AND slot_date BETWEEN ? AND ?
  `;

  db.query(sql, [clinic_id, startDate, endDate], (err, results) => {
    if (err) {
      console.error('❌ Error fetching clinic slots range:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic slots' });
    }

    // Process results into count object
    const slotCounts = {};

    results.forEach(row => {
      // Handle both string and Date formats from MySQL
      let dateKey;
      if (typeof row.slot_date === 'string') {
        dateKey = row.slot_date; // Already in YYYY-MM-DD format
      } else {
        // If it's a Date object, format it using local time components
        const d = new Date(row.slot_date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      
      let slotsArray = row.slots;

      // Parse JSON if string
      if (typeof slotsArray === 'string') {
        try {
          slotsArray = JSON.parse(slotsArray);
        } catch (e) {
          slotsArray = [];
        }
      }

      slotCounts[dateKey] = {
        available: slotsArray.filter(s => s.status === 'available').length,
        booked: slotsArray.filter(s => s.status === 'taken').length,
        pending: slotsArray.filter(s => s.status === 'pending').length,
        total: slotsArray.length
      };
    });

    console.log('✅ Clinic slots range retrieved:', startDate, 'to', endDate);
    res.status(200).json({ slots: slotCounts });
  });
});

// POST /api/clinic-slots/generate/:clinic_id/date/:date
app.post('/api/clinic-slots/generate/:clinic_id/date/:date', (req, res) => {
  const { clinic_id, date } = req.params;

  // First, get clinic hours
  const hoursSQL = 'SELECT * FROM clinic_hours_t WHERE clinic_id = ?';
  
  db.query(hoursSQL, [clinic_id], (err, hoursResult) => {
    if (err) {
      console.error('❌ Error fetching clinic hours:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic hours' });
    }

    if (hoursResult.length === 0) {
      return res.status(404).json({ error: 'Clinic hours not found. Please set clinic hours first.' });
    }

    const hoursData = hoursResult[0];
    
    // Get day of week from date
    const dateObj = new Date(date + 'T00:00:00');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = daysOfWeek[dateObj.getDay()];
    
    const dayHoursField = `${dayName}_hours`;
    let dayHours = hoursData[dayHoursField];

    // Parse if it's a string
    if (typeof dayHours === 'string') {
      try {
        dayHours = JSON.parse(dayHours);
      } catch (e) {
        dayHours = null;
      }
    }

    if (!dayHours || dayHours.status === 'Closed' || !dayHours.opening || !dayHours.closing) {
      return res.status(400).json({ error: `Clinic is closed on ${dayName}s or hours not set` });
    }

    // Generate time slots using the existing helper function
    const slots = generateTimeSlots(dayHours.opening, dayHours.closing);
    const slotsJSON = JSON.stringify(slots);
    
    // Check if slots exist for this date
    const checkSQL = 'SELECT clinic_slots_id FROM clinic_slots_t WHERE clinic_id = ? AND slot_date = ?';

    db.query(checkSQL, [clinic_id, date], (err2, checkResult) => {
      if (err2) {
        console.error('❌ Error checking clinic slots:', err2);
        return res.status(500).json({ error: 'Database error' });
      }

      if (checkResult.length === 0) {
        // INSERT
        const insertSQL = 'INSERT INTO clinic_slots_t (clinic_id, slot_date, slots) VALUES (?, ?, ?)';
        db.query(insertSQL, [clinic_id, date, slotsJSON], (err3) => {
          if (err3) {
            console.error('❌ Error inserting slots:', err3);
            return res.status(500).json({ error: 'Failed to create slots' });
          }
          console.log('✅ Default slots generated for date:', date);
          // ✅ ADD THIS: Emit socket event
          const io = req.app.get('io');
          io.emit('slotUpdated', { clinic_id, date, action: 'generated' });
          
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      } else {
        // UPDATE
        const updateSQL = 'UPDATE clinic_slots_t SET slots = ?, last_updated = NOW() WHERE clinic_id = ? AND slot_date = ?';
        db.query(updateSQL, [slotsJSON, clinic_id, date], (err3) => {
          if (err3) {
            console.error('❌ Error updating slots:', err3);
            return res.status(500).json({ error: 'Failed to update slots' });
          }
          console.log('✅ Default slots updated for date:', date);
          const io = req.app.get('io');
          io.emit('slotUpdated', { clinic_id, date, action: 'regenerated' });
          
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      }
    });
  });
});