// televet-app/backend/index.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import haversine from 'haversine-distance';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

// ✅ CORS configuration MUST be before other middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Create HTTP server & Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});

// ✅ At the top with your other variables, add this map
const usersOnChatPage = new Map(); // userId -> boolean

// ✅ Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🧩 A user connected:', socket.id);
  
  // Send a test event to confirm connection
  socket.emit('welcome', { message: 'Connected successfully!' });
  
  // ✅ Handle user joining their room
  socket.on('joinUser', (userId) => {
    const userIdStr = String(userId);
    const roomName = `user_${userIdStr}`;
    socket.join(roomName);
    console.log(`✅ User ${userIdStr} joined room: ${roomName}`);
    console.log(`📊 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
    
    // Store userId with socket
    socket.userId = userIdStr;
    
    // ✅ Query and broadcast current online status when joining
    db.query('SELECT usr_isOnline FROM user_t WHERE usr_id = ?', [userIdStr], (err, result) => {
      if (!err && result.length > 0) {
        io.emit('userStatusChanged', { 
          usr_id: userIdStr, 
          is_online: result[0].usr_isOnline 
        });
      }
    });
  });

  // ✅Track when user is on chat page
  socket.on('setOnChatPage', ({ onChatPage }) => {
    if (socket.userId) {
      usersOnChatPage.set(socket.userId, onChatPage);
      console.log(`📍 User ${socket.userId} chat page status:`, onChatPage);
    }
  });
  
  // ✅ Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`💬 Socket ${socket.id} joined chat: chat_${chatId}`);
    socket.emit('joinedChat', { chatId, success: true });
  });
  
  // ✅ Leave chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`👋 Socket ${socket.id} left chat: chat_${chatId}`);
  });

  // ✅ Track which chat the user is actively viewing
  socket.on('setActiveChat', ({ chatId, active }) => {
    if (active) {
      socket.activeChat = chatId;
      console.log(`👁️ User viewing chat: ${chatId}`);
    } else {
      socket.activeChat = null;
      console.log(`👁️ User left chat: ${chatId}`);
    }
  });
  
  // ✅ Typing indicator
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
  });

  // Add this with your other socket.on handlers
  socket.on('messagesRead', ({ chatId, userId }) => {
    // Broadcast to everyone, not just the chat room
    io.emit('messagesRead', { chatId, userId });
  });

  //VIDEO CALL SECTION
  
  socket.on('callUser', ({ userToCall, signalData, from, name, chatId, petInfo }) => { // ✅ ADD petInfo parameter
    console.log(`📞 ========= CALL EVENT =========`);
    console.log(`📞 Call from ${name} (${from})`);
    console.log(`📞 To user: ${userToCall}`);
    console.log(`📞 Pet info:`, petInfo); // ✅ LOG petInfo
    console.log('📞 VideoCall component - petInfo received:', petInfo);
    console.log('📞 VideoCall component - petInfo.name:', petInfo?.name);
    
    // ✅ CRITICAL: Convert to strings
    const targetUserId = String(userToCall);
    const callerUserId = String(from);
    const targetRoom = `user_${targetUserId}`;
    
    const roomExists = io.sockets.adapter.rooms.get(targetRoom);
    console.log(`📞 Target room "${targetRoom}" exists:`, !!roomExists);
    console.log(`📞 Target room size:`, roomExists?.size || 0);
    console.log(`📞 ===============================`);
    
    // ✅ Emit to the specific user's room WITH petInfo
    io.to(targetRoom).emit('callUser', {
      signal: signalData,
      from: callerUserId,
      name: name,
      chatId: chatId,
      petInfo: petInfo  // ✅ ADD THIS LINE - forward petInfo to receiver
    });
    
    console.log(`✅ Call event emitted to ${targetRoom} with petInfo:`, petInfo);
  });

  socket.on('answerCall', ({ signal, to }) => {
    console.log(`✅ Call answered, sending signal to ${to}`);
    const targetRoom = `user_${String(to)}`;
    io.to(targetRoom).emit('callAccepted', { signal }); // ✅ Wrap in object
  });

  socket.on('endCall', ({ to, reason }) => {
    console.log(`📴 Call ended with reason: ${reason}, notifying ${to}`);
    const targetRoom = `user_${String(to)}`;
    const senderRoom = socket.userId ? `user_${socket.userId}` : null;
    
    // ✅ Notify the other party
    io.to(targetRoom).emit('callEnded', { reason });
    
    // ✅ Also notify sender if they're in a different room
    if (senderRoom && senderRoom !== targetRoom) {
      io.to(senderRoom).emit('callEnded', { reason });
    }
  });

  //VIDEO CALL SECTION
  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    if (socket.userId) {
      usersOnChatPage.delete(socket.userId);
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    
    if (socket.userId) {
      usersOnChatPage.delete(socket.userId);
      
      // Update user status to offline in database
      db.query(
        'UPDATE user_t SET usr_isOnline = ? WHERE usr_id = ?',
        ['no', socket.userId],
        (err) => {
          if (err) console.error('❌ Error updating disconnect status:', err);
          
          // Broadcast status change
          io.emit('userStatusChanged', { usr_id: socket.userId, is_online: 'no' });
        }
      );
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ✅ Make io accessible inside routes
app.set('io', io);
app.set('usersOnChatPage', usersOnChatPage);

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

    // Update user status to online
    db.query(
      'UPDATE user_t SET usr_isOnline = ? WHERE usr_id = ?',
      ['yes', user.usr_id],
      (err) => {
        if (err) console.error('❌ Error updating login status:', err);
        
        // ✅ Broadcast status change immediately after login
        io.emit('userStatusChanged', { usr_id: user.usr_id, is_online: 'yes' });
      }
    );

    console.log("✅ Login successful for user:", {
      usr_id: user.usr_id,
      usr_firstName: user.usr_firstName,
      usr_lastName: user.usr_lastName,
      usr_email: user.usr_email,
      usr_type: user.usr_type
    });

    // ✅ Set HTTP-only cookie for session
    res.cookie('userId', user.usr_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('userType', user.usr_type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // ✅ If user is a veterinarian, fetch their vt_id
    if (user.usr_type === 'veterinarian') {
      const vetSQL = 'SELECT vt_id FROM veterinarian_t WHERE usr_id = ?';
      
      db.query(vetSQL, [user.usr_id], (vetErr, vetResult) => {
        if (vetErr) {
          console.error('❌ Error fetching vet ID:', vetErr);
          return res.status(500).json({ message: 'Database error' });
        }

        if (vetResult.length === 0) {
          console.error('❌ No veterinarian record found for usr_id:', user.usr_id);
          return res.status(404).json({ message: 'Veterinarian record not found' });
        }

        const vt_id = vetResult[0].vt_id;
        console.log('✅ Veterinarian vt_id:', vt_id);

        res.cookie('vt_id', vt_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          message: 'Login successful',
          userId: user.usr_id,
          firstName: user.usr_firstName,
          lastName: user.usr_lastName,
          userType: user.usr_type,
          vt_id: vt_id
        });
      });
    } 
    // ✅ If user is a vet admin, fetch their va_id
    else if (user.usr_type === 'vetAdmin') {
      const adminSQL = 'SELECT va_id FROM vet_admin_t WHERE usr_id = ?';
      
      db.query(adminSQL, [user.usr_id], (adminErr, adminResult) => {
        if (adminErr) {
          console.error('❌ Error fetching vet admin ID:', adminErr);
          return res.status(500).json({ message: 'Database error' });
        }

        if (adminResult.length === 0) {
          console.error('❌ No vet admin record found for usr_id:', user.usr_id);
          return res.status(404).json({ message: 'Vet admin record not found' });
        }

        const va_id = adminResult[0].va_id;
        console.log('✅ Vet Admin va_id:', va_id);

        res.cookie('va_id', va_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          message: 'Login successful',
          userId: user.usr_id,
          firstName: user.usr_firstName,
          lastName: user.usr_lastName,
          userType: user.usr_type,
          va_id: va_id
        });
      });
    }
    // ✅ For pet parents, return basic info
    else {
      return res.status(200).json({
        message: 'Login successful',
        userId: user.usr_id,
        firstName: user.usr_firstName,
        lastName: user.usr_lastName,
        userType: user.usr_type
      });
    }
  });
});

// -------------------------------------------------------------
// 🟢 LOGOUT
// -------------------------------------------------------------
app.post('/api/logout', (req, res) => {
  const userId = req.cookies.userId;
  const io = req.app.get('io');
  
  // Update user status to offline
  if (userId) {
    db.query(
      'UPDATE user_t SET usr_isOnline = ? WHERE usr_id = ?',
      ['no', userId],
      (err) => {
        if (err) console.error('❌ Error updating logout status:', err);
        
        // Broadcast status change
        io.emit('userStatusChanged', { usr_id: userId, is_online: 'no' });
      }
    );
  }
  
  res.clearCookie('userId');
  res.clearCookie('userType');
  res.clearCookie('vt_id');
  res.clearCookie('va_id');
  
  return res.status(200).json({ message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// 🟢 CHECK SESSION
// -------------------------------------------------------------
app.get('/api/check-session', (req, res) => {
  const userId = req.cookies.userId;
  const userType = req.cookies.userType;
  
  if (!userId || !userType) {
    return res.status(401).json({ authenticated: false });
  }

  // Get user details from database
  const sql = 'SELECT usr_firstName, usr_lastName FROM user_t WHERE usr_id = ?';
  
  db.query(sql, [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(401).json({ authenticated: false });
    }

    const user = result[0];
    
    return res.status(200).json({
      authenticated: true,
      userId,
      userType,
      firstName: user.usr_firstName,
      lastName: user.usr_lastName,
      vt_id: req.cookies.vt_id,
      va_id: req.cookies.va_id
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
           p.pet_dietType, p.pet_weight, p.pet_behavioralNotes, p.pet_lastUpdated,
           p.pet_image
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
// 🟢 CHECK IF EMAIL EXISTS
// -------------------------------------------------------------
app.get('/api/check-email', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sql = 'SELECT usr_id FROM user_t WHERE usr_email = ?';

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('❌ Error checking email:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // If result has rows, email exists
    res.status(200).json({ exists: result.length > 0 });
  });
});

// GET /api/clinic-by-vet/:vt_id - Get clinic info for a veterinarian
app.get('/api/clinic-by-vet/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  const sql = `
    SELECT 
      c.clinic_id,
      c.clinic_name,
      c.clinic_location,
      c.clinic_phone,
      c.clinic_email
    FROM clinic_t c
    INNER JOIN veterinarian_t vt ON c.va_id = vt.va_id
    WHERE vt.vt_id = ?
  `;

  db.query(sql, [vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic for vet:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic data' });
    }

    if (result.length === 0) {
      console.warn('⚠️ No clinic found for vt_id:', vt_id);
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log('✅ Clinic data retrieved for vt_id:', vt_id);
    res.status(200).json(result[0]);
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

    // 🩺 Step 4️⃣: Veterinarian
    else if (user.usr_type === 'veterinarian') {
      const vetSQL = `
        SELECT 
          vt_id,
          va_id,  -- references vet admin
          vt_licenseNumber,
          vt_licensingAuthority,
          vt_yearsOfPractice,
          vt_specialization,
          vt_vetLocation,
          vt_clinicName,
          vt_clinicPhone,
          vt_clinicEmail,
          vt_patientsAssigned,
          vt_onDutyToday,
          vt_consent,
          vt_createdAt
        FROM veterinarian_t
        WHERE usr_id = ?
      `;
      db.query(vetSQL, [usr_id], (err3, vetResult) => {
        if (err3) {
          console.error('❌ Error fetching veterinarian:', err3);
          return res.status(500).json({ error: 'Failed to fetch veterinarian data' });
        }
        if (vetResult.length === 0) {
          console.warn('⚠️ No veterinarian data found for usr_id:', usr_id);
          return res.status(404).json({ error: 'Veterinarian data not found' });
        }
        const profile = { ...user, ...vetResult[0] };
        console.log('✅ Sending Veterinarian Profile:', profile);
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

// 🟢 UPDATE USER PROFILE (Veterinarian)
app.put('/api/profile/veterinarian/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  const {
    usr_firstName,
    usr_lastName,
    usr_email,
    usr_password,
    vt_licenseNumber,
    vt_licensingAuthority,
    vt_yearsOfPractice,
    vt_specialization
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

    // Update veterinarian_t table
    const updateVetSQL = `
      UPDATE veterinarian_t 
      SET vt_licenseNumber = ?, vt_licensingAuthority = ?, vt_yearsOfPractice = ?, vt_specialization = ?
      WHERE usr_id = ?
    `;

    db.query(updateVetSQL, [
      vt_licenseNumber,
      vt_licensingAuthority,
      vt_yearsOfPractice,
      vt_specialization,
      usr_id
    ], (err2) => {
      if (err2) {
        console.error('❌ Error updating veterinarian:', err2);
        return res.status(500).json({ error: 'Failed to update veterinarian data' });
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
        
        // ✅ CHECK FOR DUPLICATE EMAIL ERROR
        if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('usr_email')) {
          return res.status(400).json({ 
            error: 'Email already exists. Please use a different email address.' 
          });
        }
        
        // ✅ GENERIC ERROR FOR OTHER ISSUES
        return res.status(500).json({ 
          error: 'Failed to create user. Please try again.' 
        });
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

// PUT /api/veterinarians/:vt_id/toggle-duty
app.put('/api/veterinarians/:vt_id/toggle-duty', (req, res) => {
  const { vt_id } = req.params;

  // Toggle the duty status
  const sql = `
    UPDATE veterinarian_t
    SET vt_onDutyToday = CASE 
      WHEN vt_onDutyToday = 'yes' THEN 'no'
      ELSE 'yes'
    END
    WHERE vt_id = ?
  `;

  db.query(sql, [vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error toggling duty status:', err);
      return res.status(500).json({ error: 'Failed to toggle duty status' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }

    // Fetch the updated status
    db.query('SELECT vt_onDutyToday FROM veterinarian_t WHERE vt_id = ?', [vt_id], (err2, statusResult) => {
      if (err2) {
        console.error('❌ Error fetching updated status:', err2);
        return res.status(500).json({ error: 'Failed to fetch updated status' });
      }

      const newStatus = statusResult[0].vt_onDutyToday;
      console.log(`✅ Toggled duty status for vet ${vt_id} to ${newStatus}`);
      res.status(200).json({ 
        message: 'Duty status updated successfully',
        vt_onDutyToday: newStatus 
      });
    });
  });
});

// DELETE /api/veterinarians/:vt_id
app.delete('/api/veterinarians/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  console.log('🗑️ Attempting to delete veterinarian with vt_id:', vt_id);

  // First, delete the user account
  const getUserSQL = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
  
  db.query(getUserSQL, [vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error finding user:', err);
      return res.status(500).json({ error: 'Failed to find veterinarian' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }

    const usr_id = result[0].usr_id;

    // Delete from veterinarian_t first (foreign key constraint)
    const deleteVetSQL = 'DELETE FROM veterinarian_t WHERE vt_id = ?';
    
    db.query(deleteVetSQL, [vt_id], (err2) => {
      if (err2) {
        console.error('❌ Error deleting veterinarian record:', err2);
        return res.status(500).json({ error: 'Failed to delete veterinarian record' });
      }

      // Then delete from user_t
      const deleteUserSQL = 'DELETE FROM user_t WHERE usr_id = ?';
      
      db.query(deleteUserSQL, [usr_id], (err3) => {
        if (err3) {
          console.error('❌ Error deleting user account:', err3);
          return res.status(500).json({ error: 'Failed to delete user account' });
        }

        console.log('✅ Successfully deleted veterinarian and user account');
        res.status(200).json({ message: 'Veterinarian deleted successfully' });
      });
    });
  });
});

// GET /api/pending-appointments/:clinic_id - Get pending appointments for assignment
app.get('/api/pending-appointments/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.created_at,
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_breed,
      u.usr_id,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    INNER JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    WHERE a.clinic_id = ? AND a.appt_status = 'pending'
    ORDER BY a.appt_date ASC
  `;

  db.query(sql, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching pending appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch pending appointments' });
    }

    console.log(`✅ Retrieved ${result.length} pending appointments for clinic ${clinic_id}`);
    res.status(200).json(result);
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

      // ✅ Get va_id to update related tables
      const getVaIdSQL = 'SELECT va_id FROM vet_admin_t WHERE usr_id = ?';
      
      db.query(getVaIdSQL, [usr_id], (err3, vaResult) => {
        if (err3 || vaResult.length === 0) {
          console.error('⚠️ Error getting va_id:', err3);
          return res.status(200).json({ message: 'Profile updated successfully' });
        }

        const va_id = vaResult[0].va_id;

        // ✅ Update all veterinarians under this vet admin
        const updateAllVetsSQL = `
          UPDATE veterinarian_t
          SET vt_vetLocation = ?, vt_clinicName = ?, vt_clinicPhone = ?, vt_clinicEmail = ?
          WHERE va_id = ?
        `;

        db.query(updateAllVetsSQL, [
          va_vetLocation,
          va_clinicName,
          va_clinicPhone,
          va_clinicEmail,
          va_id
        ], (err4, vetsUpdateResult) => {
          if (err4) {
            console.error('⚠️ Error updating veterinarians:', err4);
          } else {
            console.log(`✅ Updated ${vetsUpdateResult.affectedRows} veterinarians with new clinic info`);
          }

          // ✅ NEW: Update clinic_t table
          const updateClinicSQL = `
            UPDATE clinic_t
            SET clinic_name = ?, clinic_location = ?, clinic_phone = ?, clinic_email = ?, clinic_lastUpdated = NOW()
            WHERE va_id = ?
          `;

          db.query(updateClinicSQL, [
            va_clinicName,
            va_vetLocation,
            va_clinicPhone,
            va_clinicEmail,
            va_id
          ], (err5, clinicUpdateResult) => {
            if (err5) {
              console.error('⚠️ Error updating clinic:', err5);
            } else {
              console.log(`✅ Updated clinic_t with new clinic info`);
            }

            res.status(200).json({ message: 'Profile updated successfully' });
          });
        });
      });
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

// GET /api/clinic-slots/:clinic_id/date/:date/:consultation_type
app.get('/api/clinic-slots/:clinic_id/date/:date/:consultation_type', (req, res) => {
  const { clinic_id, date, consultation_type } = req.params;

  const sql = `
    SELECT 
      clinic_slots_id,
      clinic_id,
      slot_date,
      consultation_type,
      slots,
      last_updated
    FROM clinic_slots_t
    WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
  `;

  db.query(sql, [clinic_id, date, consultation_type], (err, result) => {
    if (err) {
      console.error('❌ Error fetching clinic slots by date:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic slots' });
    }

    if (result.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    const slotsData = result[0];
    if (slotsData.slots && typeof slotsData.slots === 'string') {
      try {
        slotsData.slots = JSON.parse(slotsData.slots);
      } catch (e) {
        console.warn('⚠️ Could not parse slots:', slotsData.slots);
      }
    }

    res.status(200).json(slotsData);
  });
});

// PUT /api/clinic-slots/:clinic_id/date/:date/:consultation_type
app.put('/api/clinic-slots/:clinic_id/date/:date/:consultation_type', (req, res) => {
  const { clinic_id, date, consultation_type } = req.params;
  const { slots } = req.body;
  const io = req.app.get('io');

  if (!slots) {
    return res.status(400).json({ error: 'Slots data is required' });
  }

  const slotsJSON = JSON.stringify(slots);

  const checkSQL = `
    SELECT clinic_slots_id FROM clinic_slots_t 
    WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
  `;

  db.query(checkSQL, [clinic_id, date, consultation_type], (err, result) => {
    if (err) {
      console.error('❌ Error checking clinic slots:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      const insertSQL = `
        INSERT INTO clinic_slots_t (clinic_id, slot_date, consultation_type, slots)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertSQL, [clinic_id, date, consultation_type, slotsJSON], (err2) => {
        if (err2) {
          console.error('❌ Error inserting clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to create clinic slots' });
        }

        io.emit('slotUpdated', { clinic_id, date, consultation_type, action: 'created' });
        res.status(200).json({ message: 'Clinic slots created successfully' });
      });
    } else {
      const updateSQL = `
        UPDATE clinic_slots_t
        SET slots = ?, last_updated = NOW()
        WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
      `;

      db.query(updateSQL, [slotsJSON, clinic_id, date, consultation_type], (err2) => {
        if (err2) {
          console.error('❌ Error updating clinic slots:', err2);
          return res.status(500).json({ error: 'Failed to update clinic slots' });
        }

        io.emit('slotUpdated', { clinic_id, date, consultation_type, action: 'updated' });
        res.status(200).json({ message: 'Clinic slots updated successfully' });
      });
    }
  });
});

/// GET /api/clinic-slots/:clinic_id/range/:consultation_type
app.get('/api/clinic-slots/:clinic_id/range/:consultation_type', (req, res) => {
  const { clinic_id, consultation_type } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const sql = `
    SELECT 
      slot_date,
      slots
    FROM clinic_slots_t
    WHERE clinic_id = ? AND consultation_type = ? AND slot_date BETWEEN ? AND ?
  `;

  db.query(sql, [clinic_id, consultation_type, startDate, endDate], (err, results) => {
    if (err) {
      console.error('❌ Error fetching clinic slots range:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic slots' });
    }

    const slotCounts = {};

    results.forEach(row => {
      let dateKey;
      if (typeof row.slot_date === 'string') {
        dateKey = row.slot_date;
      } else {
        const d = new Date(row.slot_date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      
      let slotsArray = row.slots;

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

    res.status(200).json({ slots: slotCounts });
  });
});

// POST /api/clinic-slots/generate/:clinic_id/date/:date/:consultation_type
app.post('/api/clinic-slots/generate/:clinic_id/date/:date/:consultation_type', (req, res) => {
  const { clinic_id, date, consultation_type } = req.params;

  const hoursSQL = 'SELECT * FROM clinic_hours_t WHERE clinic_id = ?';
  
  db.query(hoursSQL, [clinic_id], (err, hoursResult) => {
    if (err) {
      console.error('❌ Error fetching clinic hours:', err);
      return res.status(500).json({ error: 'Failed to fetch clinic hours' });
    }

    if (hoursResult.length === 0) {
      return res.status(404).json({ error: 'Clinic hours not found' });
    }

    const hoursData = hoursResult[0];
    const dateObj = new Date(date + 'T00:00:00');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = daysOfWeek[dateObj.getDay()];
    
    const dayHoursField = `${dayName}_hours`;
    let dayHours = hoursData[dayHoursField];

    if (typeof dayHours === 'string') {
      try {
        dayHours = JSON.parse(dayHours);
      } catch (e) {
        dayHours = null;
      }
    }

    if (!dayHours || dayHours.status === 'Closed' || !dayHours.opening || !dayHours.closing) {
      return res.status(400).json({ error: `Clinic is closed on ${dayName}s` });
    }

    // Generate different slot intervals based on consultation type
    const interval = consultation_type === 'online' ? 15 : 30; // 15 min for online, 30 for physical
    const slots = generateTimeSlotsWithInterval(dayHours.opening, dayHours.closing, interval);
    const slotsJSON = JSON.stringify(slots);
    
    const checkSQL = `
      SELECT clinic_slots_id FROM clinic_slots_t 
      WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
    `;

    db.query(checkSQL, [clinic_id, date, consultation_type], (err2, checkResult) => {
      if (err2) {
        console.error('❌ Error checking clinic slots:', err2);
        return res.status(500).json({ error: 'Database error' });
      }

      if (checkResult.length === 0) {
        const insertSQL = `
          INSERT INTO clinic_slots_t (clinic_id, slot_date, consultation_type, slots) 
          VALUES (?, ?, ?, ?)
        `;
        db.query(insertSQL, [clinic_id, date, consultation_type, slotsJSON], (err3) => {
          if (err3) {
            console.error('❌ Error inserting slots:', err3);
            return res.status(500).json({ error: 'Failed to create slots' });
          }
          
          const io = req.app.get('io');
          io.emit('slotUpdated', { clinic_id, date, consultation_type, action: 'generated' });
          
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      } else {
        const updateSQL = `
          UPDATE clinic_slots_t 
          SET slots = ?, last_updated = NOW() 
          WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
        `;
        db.query(updateSQL, [slotsJSON, clinic_id, date, consultation_type], (err3) => {
          if (err3) {
            console.error('❌ Error updating slots:', err3);
            return res.status(500).json({ error: 'Failed to update slots' });
          }
          
          const io = req.app.get('io');
          io.emit('slotUpdated', { clinic_id, date, consultation_type, action: 'regenerated' });
          
          res.status(200).json({ message: 'Default slots generated successfully', slots });
        });
      }
    });
  });
});

// Helper function with configurable interval
function generateTimeSlotsWithInterval(openingTime, closingTime, interval = 30) {
  const slots = [];
  let slotId = 1;

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
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

// GET /api/clinic-appointments-count/:clinic_id
app.get('/api/clinic-appointments-count/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const weekStartStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;

  // Get end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekEndStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

  // Get start and end of month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthEndStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

  const sql = `
    SELECT slot_date, slots
    FROM clinic_slots_t
    WHERE clinic_id = ? 
    AND slot_date BETWEEN ? AND ?
  `;

  db.query(sql, [clinic_id, monthStartStr, monthEndStr], (err, results) => {
    if (err) {
      console.error('❌ Error fetching appointment counts:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment counts' });
    }

    let appointmentsToday = 0;
    let appointmentsThisWeek = 0;
    let appointmentsThisMonth = 0;

    results.forEach(row => {
      let slotsArray = row.slots;
      
      // Parse JSON if string
      if (typeof slotsArray === 'string') {
        try {
          slotsArray = JSON.parse(slotsArray);
        } catch (e) {
          slotsArray = [];
        }
      }

      // Count only confirmed appointments (status = 'taken')
      const appointmentCount = slotsArray.filter(s => s.status === 'taken').length;

      // Format date for comparison
      let dateKey;
      if (typeof row.slot_date === 'string') {
        dateKey = row.slot_date;
      } else {
        const d = new Date(row.slot_date);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      // Count for today
      if (dateKey === todayStr) {
        appointmentsToday += appointmentCount;
      }

      // Count for this week
      if (dateKey >= weekStartStr && dateKey <= weekEndStr) {
        appointmentsThisWeek += appointmentCount;
      }

      // Count for this month (all results are already filtered by month)
      appointmentsThisMonth += appointmentCount;
    });

    console.log('✅ Appointment counts retrieved for clinic_id:', clinic_id);
    res.status(200).json({
      today: appointmentsToday,
      thisWeek: appointmentsThisWeek,
      thisMonth: appointmentsThisMonth
    });
  });
});

// GET /api/user-appointments/:usr_id - Get all scheduled appointments for a user
app.get('/api/user-appointments/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.resched_flag,
      a.resched_reason,
      a.created_at,
      pet.pet_id,
      pet.pet_name,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    INNER JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE pp.usr_id = ? AND a.appt_status IN ('scheduled', 'pending')
    ORDER BY a.appt_date ASC
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching user appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    console.log(`✅ Retrieved ${result.length} appointments for user ${usr_id}`);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 GET ALL PATIENTS FOR A SPECIFIC VET ADMIN (by clinic name)
// -------------------------------------------------------------
app.get('/api/patients/clinic/:clinicName', (req, res) => {
  const { clinicName } = req.params;

  console.log("🐾 GET patients for clinic:", clinicName);
  console.log("🔍 Decoded clinic name:", decodeURIComponent(clinicName));

  const sql = `
    SELECT 
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_age,
      pet.pet_gender,
      pet.pet_breed,
      pet.pet_weight,
      pet.pet_hasVaccination,
      pet.pet_vaccinationDate,
      pet.pet_hasMedication,
      pet.pet_medicationDetails,
      pet.pet_hasAllergies,
      pet.pet_allergyDetails,
      pet.pet_dietType,
      pet.pet_behavioralNotes,
      pet.pet_lastUpdated,
      pet.pet_assignedVet,
      pp.pp_id,
      pp.pp_assignedClinic,
      pp.createdAt as pp_createdAt,
      u.usr_id,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName,
      u.usr_email as owner_email,
      vt.vt_id,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name,
      (SELECT appt_status FROM appointment_t 
       WHERE pet_id = pet.pet_id 
       AND clinic_id = (SELECT clinic_id FROM clinic_t WHERE clinic_name = ?)
       ORDER BY created_at DESC LIMIT 1) as appt_status,
      (SELECT appt_id FROM appointment_t 
       WHERE pet_id = pet.pet_id 
       AND clinic_id = (SELECT clinic_id FROM clinic_t WHERE clinic_name = ?)
       ORDER BY created_at DESC LIMIT 1) as appt_id
    FROM pet_t pet
    INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN veterinarian_t vt ON pet.pet_assignedVet = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE pp.pp_assignedClinic IS NOT NULL 
    AND pp.pp_assignedClinic = ?
    GROUP BY pet.pet_id
    ORDER BY pp.createdAt DESC
  `;

  db.query(sql, [
    decodeURIComponent(clinicName), 
    decodeURIComponent(clinicName), 
    decodeURIComponent(clinicName)
  ], (err, result) => {
    if (err) {
      console.error('❌ Error fetching patients:', err);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    console.log(`✅ Retrieved ${result.length} patients for clinic ${clinicName}`);
    console.log('📋 First patient (if any):', result[0]);
    res.status(200).json(result);
  });
});


// -------------------------------------------------------------
// 🟢 GET SINGLE PATIENT DETAILS
// -------------------------------------------------------------
app.get('/api/patients/:pet_id', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      pet.*,
      pp.pp_assignedClinic,
      pp.createdAt as pp_createdAt,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName,
      u.usr_email as owner_email,
      vt.vt_id,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
    FROM pet_t pet
    INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN veterinarian_t vt ON pet.pet_assignedVet = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE pet.pet_id = ?
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching patient details:', err);
      return res.status(500).json({ error: 'Failed to fetch patient details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json(result[0]);
  });
});

// Add this helper function at the top of your backend file (near other helper functions)
const formatAppointmentDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
// -------------------------------------------------------------
// 🟢 ASSIGN VET TO PATIENT (UPDATED WITH VET NOTIFICATION)
// -------------------------------------------------------------
app.put('/api/patients/:pet_id/assign-vet', (req, res) => {
  const { pet_id } = req.params;
  const { vt_id } = req.body;
  const io = req.app.get('io');

  if (!vt_id) {
    return res.status(400).json({ error: 'Veterinarian ID is required' });
  }

  // First, update the pet's assigned vet
  const updatePetSQL = `
    UPDATE pet_t
    SET pet_assignedVet = ?, pet_lastUpdated = NOW()
    WHERE pet_id = ?
  `;

  db.query(updatePetSQL, [vt_id, pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error assigning vet to patient:', err);
      return res.status(500).json({ error: 'Failed to assign vet' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get vet name and usr_id in ONE query
    const getVetInfoSQL = `
      SELECT vt.vt_id, u.usr_id, u.usr_firstName, u.usr_lastName 
      FROM veterinarian_t vt
      INNER JOIN user_t u ON vt.usr_id = u.usr_id
      WHERE vt.vt_id = ?
    `;

    db.query(getVetInfoSQL, [vt_id], (errVet, vetResult) => {
      if (errVet || vetResult.length === 0) {
        console.error('❌ Error getting vet info:', errVet);
        return res.status(500).json({ error: 'Failed to get vet info' });
      }

      const vetInfo = vetResult[0];
      const vetName = `Dr. ${vetInfo.usr_firstName} ${vetInfo.usr_lastName}`;
      const vet_usr_id = vetInfo.usr_id;

      console.log(`✅ Found vet: ${vetName}, usr_id: ${vet_usr_id}`);

      // Get pending appointment details for this pet
      const getAppointmentSQL = `
        SELECT 
          a.appt_id,
          a.appt_date,
          a.appt_type,
          a.consultation_type,
          a.appt_description,
          a.created_at,
          a.clinic_id,
          a.resched_flag,
          pet.pet_id,
          pet.pet_name
        FROM appointment_t a
        INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
        WHERE a.pet_id = ? AND (a.appt_status = 'pending' OR (a.appt_status = 'scheduled' AND a.resched_flag = 'yes'))
        ORDER BY a.created_at DESC
        LIMIT 1
      `;

      db.query(getAppointmentSQL, [pet_id], (err2, apptResult) => {
        // Update appointment status
        const updateAppointmentsSQL = `
        UPDATE appointment_t
        SET vt_id = ?, appt_status = 'scheduled', updated_at = NOW()
        WHERE pet_id = ? AND (appt_status = 'pending' OR (appt_status = 'scheduled' AND resched_flag = 'yes'))
        `;

        db.query(updateAppointmentsSQL, [vt_id, pet_id], (err3) => {
          if (err3) {
            console.error('⚠️ Error updating appointments:', err3);
          } else {
            console.log(`✅ Updated appointments for pet ${pet_id} with vet ${vt_id}`);
          }

          // Update vet patient count
          const updateVetSQL = `
            UPDATE veterinarian_t
            SET vt_patientsAssigned = vt_patientsAssigned + 1
            WHERE vt_id = ?
          `;

          db.query(updateVetSQL, [vt_id], (err4) => {
            if (err4) {
              console.error('⚠️ Error updating vet patient count:', err4);
            }

            // If we have appointment, update the slot AND create notifications
            if (!err2 && apptResult.length > 0) {
              const appt = apptResult[0];
              const appointmentId = appt.appt_id;
              const appointmentDate = appt.appt_date;
              const pet_name = appt.pet_name;
              const appointmentDetails = appt;

              const apptDate = new Date(appt.appt_date);
              const dateKey = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`;

              // Get slots for this date AND consultation type
              const getSlotsSQL = `
                SELECT slots 
                FROM clinic_slots_t 
                WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
              `;

              db.query(getSlotsSQL, [appt.clinic_id, dateKey, appt.consultation_type], (err5, slotsResult) => {
                if (!err5 && slotsResult.length > 0) {
                  let slots = slotsResult[0].slots;
                  
                  // Parse if string
                  if (typeof slots === 'string') {
                    try {
                      slots = JSON.parse(slots);
                    } catch (parseErr) {
                      console.error('⚠️ Error parsing slots:', parseErr);
                      return res.status(200).json({ message: 'Vet assigned successfully' });
                    }
                  }

                  console.log('🔍 Looking for pending slot with petId:', pet_id);

                  // Update slot - match by petId instead of patient name
                  const updatedSlots = slots.map(slot => {
                    if (slot.status === 'pending' && slot.petId == pet_id) {
                      console.log('✅ Found matching slot:', slot);
                      return {
                        ...slot,
                        status: 'taken',
                        veterinarian: vetName,
                        vt_id: vt_id
                      };
                    }
                    return slot;
                  });

                  // Save updated slots
                  const updateSlotsSQL = `
                    UPDATE clinic_slots_t 
                    SET slots = ?, last_updated = NOW()
                    WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?
                  `;

                  db.query(updateSlotsSQL, [JSON.stringify(updatedSlots), appt.clinic_id, dateKey, appt.consultation_type], (err6) => {
                    if (!err6) {
                      console.log(`✅ Slot updated to 'taken' for pet ${pet_id}`);
                      io.emit('slotUpdated', { clinic_id: appt.clinic_id, date: dateKey, consultation_type: appt.consultation_type, action: 'assigned' });
                    } else {
                      console.error('⚠️ Error updating slot:', err6);
                    }
                  });
                } else {
                  console.error('⚠️ No slots found for date:', dateKey);
                }
              });

              // ✅ CREATE NOTIFICATIONS FOR BOTH OWNER AND VET
              const getOwnerSQL = `
              SELECT pp.usr_id
              FROM pet_t pet
              INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
              WHERE pet.pet_id = ?
              `;

              db.query(getOwnerSQL, [pet_id], (errOwner, ownerResult) => {
              if (!errOwner && ownerResult.length > 0) {
                const owner_usr_id = ownerResult[0].usr_id;
                
                // ✅ Check if this was a rescheduled appointment
                const wasRescheduled = appt.resched_flag === 'yes';
                
                // Create appropriate notification message
                const ownerMessage = wasRescheduled 
                  ? `Your rescheduled appointment for ${pet_name} has been approved by ${vetName}.`
                  : `Your appointment for ${pet_name} has been approved by ${vetName}.`;
                
                createNotification(owner_usr_id, pet_id, appointmentId, 'approved', ownerMessage, appointmentDate);
                console.log(`✅ Owner notification sent to usr_id: ${owner_usr_id} (${wasRescheduled ? 'rescheduled' : 'new'} appointment)`);

                // Now clear the reschedule flags AFTER notification is sent
                if (wasRescheduled) {
                  const clearRescheduleSQL = `
                    UPDATE appointment_t
                    SET resched_flag = 'no', resched_reason = NULL
                    WHERE appt_id = ?
                  `;
                  db.query(clearRescheduleSQL, [appointmentId], (errClear) => {
                    if (!errClear) {
                      console.log(`✅ Cleared reschedule flags for appt_id: ${appointmentId}`);
                    }
                  });
                }

                // ✅ CREATE NOTIFICATION FOR VET (we already have vet_usr_id from earlier!)
                // First verify this usr_id belongs to a veterinarian, not vet admin
                const checkVetSQL = `SELECT vt_id FROM veterinarian_t WHERE usr_id = ?`;
                db.query(checkVetSQL, [vet_usr_id], (errCheck, checkResult) => {
                  if (!errCheck && checkResult.length > 0) {
                    // This is indeed a veterinarian, safe to send notification
                    const vetMessage = `You have been assigned to ${pet_name} for appointment`;
                    createNotification(vet_usr_id, pet_id, appointmentId, 'assigned', vetMessage, appointmentDate);
                    console.log(`✅ Vet notification sent to usr_id: ${vet_usr_id} for vt_id: ${vt_id}`);
                  } else {
                    console.log(`⏭️ Skipped vet notification - usr_id ${vet_usr_id} is not a veterinarian`);
                  }
                });
              } else {
                console.error('❌ Error fetching owner usr_id:', errOwner);
              }
              });

              // Send response after all operations
              res.status(200).json({ message: 'Vet assigned successfully' });

              } else {
              console.log(`✅ Patient ${pet_id} assigned to vet ${vt_id} (no appointment found)`);
              res.status(200).json({ message: 'Vet assigned successfully' });
              }
          });
        });
      });
    });
  });
});

// GET /api/appointment-details/:appt_id
app.get('/api/appointment-details/:appt_id', (req, res) => {
  const { appt_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.created_at,
      a.cancel_reason,
      a.cancel_by as cancelled_by,
      a.cancel_dt as cancelled_at,
      a.resched_flag,
      a.resched_reason,
      pet.pet_name,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE a.appt_id = ?
  `;

  db.query(sql, [appt_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching appointment details:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json(result[0]);
  });
});

// GET /api/appointment-by-pet/:pet_id
app.get('/api/appointment-by-pet/:pet_id', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.created_at,
      pet.pet_name
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    WHERE a.pet_id = ? AND a.appt_status = 'pending'
    ORDER BY a.created_at DESC
    LIMIT 1
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching appointment details:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json(result[0]);
  });
});

// GET /api/scheduled-appointment-by-pet/:pet_id - Get scheduled appointment for a pet
app.get('/api/scheduled-appointment-by-pet/:pet_id', (req, res) => {
  const { pet_id } = req.params;
  const { appt_date } = req.query; // Get date from query parameter

  let sql;
  let params;

  if (appt_date) {
    // If date is provided, find the exact appointment
    sql = `
      SELECT 
        a.appt_id,
        a.appt_type,
        a.consultation_type,
        a.appt_description,
        a.appt_date,
        a.appt_status,
        a.created_at,
        pet.pet_name,
        CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
      FROM appointment_t a
      INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
      LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
      LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
      WHERE a.pet_id = ? AND a.appt_status = 'scheduled' AND a.appt_date = ?
      LIMIT 1
    `;
    params = [pet_id, appt_date];
  } else {
    // If no date provided, get the most recent scheduled appointment
    sql = `
      SELECT 
        a.appt_id,
        a.appt_type,
        a.consultation_type,
        a.appt_description,
        a.appt_date,
        a.appt_status,
        a.created_at,
        pet.pet_name,
        CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
      FROM appointment_t a
      INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
      LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
      LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
      WHERE a.pet_id = ? AND a.appt_status = 'scheduled'
      ORDER BY a.appt_date DESC
      LIMIT 1
    `;
    params = [pet_id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Error fetching scheduled appointment details:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'No scheduled appointment found' });
    }

    res.status(200).json(result[0]);
  });
});
// -------------------------------------------------------------
// 🟢 DELETE PATIENT (removes from clinic)
// -------------------------------------------------------------
app.delete('/api/patients/:pet_id', (req, res) => {
  const { pet_id } = req.params;

  // First check if patient has an assigned vet to decrement their count
  const checkSQL = 'SELECT pet_assignedVet FROM pet_t WHERE pet_id = ?';
  
  db.query(checkSQL, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error checking patient:', err);
      return res.status(500).json({ error: 'Failed to delete patient' });
    }

    const assignedVet = result[0]?.pet_assignedVet;

    // Delete the patient by removing their clinic assignment
    const deleteSQL = `
      UPDATE pet_parent_t pp
      INNER JOIN pet_t pet ON pp.pp_id = pet.pp_id
      SET pp.pp_assignedClinic = NULL, pp.pp_lastUpdated = NOW()
      WHERE pet.pet_id = ?
    `;

    db.query(deleteSQL, [pet_id], (err2, deleteResult) => {
      if (err2) {
        console.error('❌ Error deleting patient:', err2);
        return res.status(500).json({ error: 'Failed to delete patient' });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // If patient had an assigned vet, decrement their count
      if (assignedVet) {
        const updateVetSQL = `
          UPDATE veterinarian_t
          SET vt_patientsAssigned = GREATEST(vt_patientsAssigned - 1, 0)
          WHERE vt_id = ?
        `;

        db.query(updateVetSQL, [assignedVet], (err3) => {
          if (err3) {
            console.error('⚠️ Error updating vet patient count:', err3);
          }
        });
      }

      console.log(`✅ Patient ${pet_id} removed from clinic`);
      res.status(200).json({ message: 'Patient removed successfully' });
    });
  });
});

// GET /api/user-pets/:usr_id
app.get('/api/user-pets/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  const sql = `
    SELECT 
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_breed,
      pet.pet_age,
      pet.pet_gender
    FROM pet_t pet
    INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
    WHERE pp.usr_id = ?
    ORDER BY pet.pet_name ASC
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching user pets:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }

    res.status(200).json(result);
  });
});
// -------------------------------------------------------------
// 🟢 CREATE APPOINTMENT (WITH VET ADMIN NOTIFICATION)
// -------------------------------------------------------------
app.post('/api/appointments', (req, res) => {
  const {
    clinic_id,
    pet_id,
    usr_id,
    appt_type,
    consultation_type,
    appt_description,
    appt_date,
    slot_time
  } = req.body;

  console.log('📅 Creating appointment:', {
    clinic_id,
    pet_id,
    usr_id,
    appt_type,
    consultation_type,
    appt_date
  });

  // First, get pp_id and pet name
  const getPpIdSQL = `
    SELECT pp.pp_id, pet.pet_name
    FROM pet_parent_t pp
    INNER JOIN pet_t pet ON pp.pp_id = pet.pp_id
    WHERE pp.usr_id = ? AND pet.pet_id = ?
  `;
  
  db.query(getPpIdSQL, [usr_id, pet_id], (err, ppResult) => {
    if (err) {
      console.error('❌ Error fetching pp_id:', err);
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    if (ppResult.length === 0) {
      return res.status(404).json({ error: 'Pet parent not found' });
    }

    const pp_id = ppResult[0].pp_id;
    const pet_name = ppResult[0].pet_name;

    // Insert appointment
    const insertSQL = `
      INSERT INTO appointment_t (
        clinic_id,
        pet_id,
        pp_id,
        appt_type,
        consultation_type,
        appt_description,
        appt_date,
        appt_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.query(insertSQL, [
      clinic_id,
      pet_id,
      pp_id,
      appt_type,
      consultation_type, // ADD THIS
      appt_description || null,
      appt_date
    ], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating appointment:', err2);
        return res.status(500).json({ error: 'Failed to create appointment' });
      }

      const appt_id = result.insertId;

      // Create pending notification for PET OWNER
      const ownerMessage = `Your appointment request for ${pet_name} is pending approval.`;
      createNotification(usr_id, pet_id, appt_id, 'pending', ownerMessage, appt_date);

      // ✅ GET VET ADMIN usr_id AND CREATE NOTIFICATION FOR THEM
      const getVetAdminSQL = `
        SELECT u.usr_id 
        FROM vet_admin_t va
        INNER JOIN user_t u ON va.usr_id = u.usr_id
        INNER JOIN clinic_t c ON va.va_id = c.va_id
        WHERE c.clinic_id = ?
      `;

      db.query(getVetAdminSQL, [clinic_id], (err3, adminResult) => {
        if (!err3 && adminResult.length > 0) {
          const vetAdminUsrId = adminResult[0].usr_id;
          
          console.log('🔍 Found vet admin usr_id:', vetAdminUsrId); // Debug log
          
          // Format appointment date for notification
          const apptDate = new Date(appt_date);
          const formattedDate = apptDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          const adminMessage = `${pet_name} has booked an appointment awaiting approval on ${formattedDate}`;
          createNotification(vetAdminUsrId, pet_id, appt_id, 'pending', adminMessage, appt_date);
          
          console.log(`✅ Vet admin notification sent to usr_id: ${vetAdminUsrId}`); // Fixed syntax
        } else {
          console.error('❌ Error fetching vet admin usr_id:', err3);
        }
      });

      console.log('✅ Appointment created successfully, ID:', appt_id);
      res.status(201).json({
        message: 'Appointment created successfully',
        appt_id: appt_id
      });
    });
  });
});

// -------------------------------------------------------------
// 🟢 GET APPOINTMENTS BY CLINIC
// -------------------------------------------------------------
app.get('/api/appointments/clinic/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.clinic_id,
      a.appt_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.created_at,
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_breed,
      pet.pet_age,
      pet.pet_gender,
      u.usr_id,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName,
      u.usr_email as owner_email,
      vt.vt_id,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    INNER JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE a.clinic_id = ?
    ORDER BY a.appt_date ASC
  `;

  db.query(sql, [clinic_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    console.log(`✅ Retrieved ${result.length} appointments for clinic ${clinic_id}`);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE APPOINTMENT STATUS
// -------------------------------------------------------------
app.put('/api/appointments/:appt_id/status', (req, res) => {
  const { appt_id } = req.params;
  const { status } = req.body;

  if (!['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const sql = `
    UPDATE appointment_t
    SET appt_status = ?, updated_at = NOW()
    WHERE appt_id = ?
  `;

  db.query(sql, [status, appt_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating appointment status:', err);
      return res.status(500).json({ error: 'Failed to update appointment' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log(`✅ Appointment ${appt_id} status updated to ${status}`);
    res.status(200).json({ message: 'Appointment status updated successfully' });
  });
});

// Cancel appointment endpoint
app.put('/api/appointments/:apptId/cancel', (req, res) => {
  const { apptId } = req.params;
  const { cancelReason, cancelledBy } = req.body;
  const io = req.app.get('io');

  db.query(
    `UPDATE appointment_t 
     SET appt_status = 'cancelled', 
         cancel_reason = ?, 
         cancel_by = ?,
         cancel_dt = NOW()
     WHERE appt_id = ?`,
    [cancelReason || null, cancelledBy, apptId],
    (err, result) => {
      if (err) {
        console.error('❌ Error cancelling appointment:', err);
        return res.status(500).json({ error: 'Failed to cancel appointment' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Get appointment details for notification
      const getApptSQL = `
        SELECT a.*, p.pet_name, u.usr_firstName, u.usr_lastName, pp.usr_id as owner_usr_id
        FROM appointment_t a
        JOIN pet_t p ON a.pet_id = p.pet_id
        JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
        JOIN user_t u ON pp.usr_id = u.usr_id
        WHERE a.appt_id = ?
      `;

      db.query(getApptSQL, [apptId], (err2, apptResult) => {
        if (err2 || apptResult.length === 0) {
          console.error('⚠️ Error fetching appointment details:', err2);
          return res.json({ message: 'Appointment cancelled successfully' });
        }

        const apptData = apptResult[0];
        const formattedApptDate = new Date(apptData.appt_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Send notification to the other party
        if (cancelledBy === 'petParent') {
          // Notify vet if assigned
          if (apptData.vt_id) {
            const getVetSQL = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
            db.query(getVetSQL, [apptData.vt_id], (err3, vetResult) => {
              if (!err3 && vetResult.length > 0) {
                const notifMsg = `Appointment for ${apptData.pet_name} on ${formattedApptDate} has been cancelled by the pet owner.${cancelReason ? ` Reason: ${cancelReason}` : ''}`;
                createNotification(vetResult[0].usr_id, apptData.pet_id, apptId, 'cancelled', notifMsg, apptData.appt_date);
              }
            });
          }
          
          // ALWAYS notify vet admin
          const getVetAdminSQL = `
            SELECT u.usr_id 
            FROM vet_admin_t va
            INNER JOIN user_t u ON va.usr_id = u.usr_id
            INNER JOIN clinic_t c ON va.va_id = c.va_id
            WHERE c.clinic_id = ?
          `;
          db.query(getVetAdminSQL, [apptData.clinic_id], (err4, adminResult) => {
            if (!err4 && adminResult.length > 0) {
              const adminMsg = `Appointment for ${apptData.pet_name} on ${formattedApptDate} has been cancelled by the pet owner.${cancelReason ? ` Reason: ${cancelReason}` : ''}`;
              createNotification(adminResult[0].usr_id, apptData.pet_id, apptId, 'cancelled', adminMsg, apptData.appt_date);
              console.log(`✅ Vet admin notified of cancellation`);
            }
          });
        } else if (cancelledBy === 'veterinarian') {
          // Notify pet owner
          const notifMsg = `Your appointment for ${apptData.pet_name} on ${formattedApptDate} has been cancelled by the veterinarian.${cancelReason ? ` Reason: ${cancelReason}` : ''}`;
          createNotification(apptData.owner_usr_id, apptData.pet_id, apptId, 'cancelled', notifMsg, apptData.appt_date);
        }

        // Update slot status
        const slotDate = new Date(apptData.appt_date);
        const dateKey = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
        
        const getSlotsSQL = 'SELECT slots FROM clinic_slots_t WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
        db.query(getSlotsSQL, [apptData.clinic_id, dateKey, apptData.consultation_type], (err4, slotsResult) => {
          if (!err4 && slotsResult.length > 0) {
            let slots = slotsResult[0].slots;
            if (typeof slots === 'string') {
              try {
                slots = JSON.parse(slots);
              } catch (e) {
                console.error('⚠️ Error parsing slots:', e);
                return;
              }
            }

            const updatedSlots = slots.map(slot => {
              if (slot.petId == apptData.pet_id) {
                return {
                  ...slot,
                  status: 'available',
                  patient: null,
                  petId: null,
                  veterinarian: null,
                  vt_id: null
                };
              }
              return slot;
            });

            const updateSlotsSQL = 'UPDATE clinic_slots_t SET slots = ?, last_updated = NOW() WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
            db.query(updateSlotsSQL, [JSON.stringify(updatedSlots), apptData.clinic_id, dateKey, apptData.consultation_type], (err5) => {
              if (!err5) {
                io.emit('slotUpdated', { clinic_id: apptData.clinic_id, date: dateKey, consultation_type: apptData.consultation_type, action: 'cancelled' });
              }
            });
          }
        });

        res.json({ message: 'Appointment cancelled successfully' });
      });
    }
  );
});

// Request reschedule endpoint
// Request reschedule endpoint


// PUT /api/appointments/:apptId/reschedule - Complete reschedule with new slot
// PUT /api/appointments/:apptId/reschedule - Complete reschedule with new slot
// PUT /api/appointments/:apptId/reschedule - Complete reschedule with new slot
app.put('/api/appointments/:apptId/reschedule', (req, res) => {
  const { apptId } = req.params;
  const { new_appt_date, new_slot_time, appt_type, consultation_type, appt_description, reschedule_reason } = req.body;
  const io = req.app.get('io');

  console.log('🔄 Reschedule request:', {
    apptId,
    new_appt_date,
    new_slot_time,
    consultation_type,
    reschedule_reason
  });

  // Step 1: Get old appointment details first
  const getOldApptSQL = `
    SELECT a.*, p.pet_name, pp.usr_id as owner_usr_id, pp.pp_id
    FROM appointment_t a
    JOIN pet_t p ON a.pet_id = p.pet_id
    JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
    WHERE a.appt_id = ?
  `;

  db.query(getOldApptSQL, [apptId], (err, oldApptResult) => {
    if (err || oldApptResult.length === 0) {
      console.error('❌ Error fetching old appointment:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment' });
    }

    const oldAppt = oldApptResult[0];
    const oldDate = new Date(oldAppt.appt_date);
    const oldDateKey = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;

    const newDate = new Date(new_appt_date);
    const newDateKey = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;

    console.log('📅 Date keys:', { oldDateKey, newDateKey });
    console.log('🔍 Old appointment vt_id:', oldAppt.vt_id);

    // Format dates for notifications
    const formattedNewDate = new Date(new_appt_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const formattedOldDate = new Date(oldAppt.appt_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Step 2: Send VET notification FIRST (synchronously) if assigned
    const sendVetNotification = (callback) => {
      if (oldAppt.vt_id) {
        console.log('📧 Attempting to notify vet with vt_id:', oldAppt.vt_id);
        const getVetSQL = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
        db.query(getVetSQL, [oldAppt.vt_id], (errVet, vetResult) => {
          if (!errVet && vetResult.length > 0) {
            const vetMsg = `Appointment for ${oldAppt.pet_name} has been rescheduled from ${formattedOldDate} to ${formattedNewDate}. Reason: "${reschedule_reason}". You have been unassigned from this appointment.`;
            createNotification(vetResult[0].usr_id, oldAppt.pet_id, apptId, 'cancelled', vetMsg, new_appt_date);
            console.log(`✅ Vet notification sent to usr_id: ${vetResult[0].usr_id}`);
          } else {
            console.log('⚠️ No vet found or error:', errVet);
          }
          callback(); // Continue to next step
        });
      } else {
        console.log('⏭️ No vet assigned, skipping vet notification');
        callback(); // No vet, continue
      }
    };

    // Execute vet notification, then continue
    sendVetNotification(() => {
      // Step 3: Release OLD slot
      const getOldSlotsSQL = 'SELECT slots FROM clinic_slots_t WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
      
      db.query(getOldSlotsSQL, [oldAppt.clinic_id, oldDateKey, oldAppt.consultation_type], (err2, oldSlotsResult) => {
        if (!err2 && oldSlotsResult.length > 0) {
          let oldSlots = oldSlotsResult[0].slots;
          if (typeof oldSlots === 'string') {
            try {
              oldSlots = JSON.parse(oldSlots);
            } catch (e) {
              console.error('⚠️ Error parsing old slots:', e);
            }
          }

          const updatedOldSlots = oldSlots.map(slot => {
            if (slot.petId == oldAppt.pet_id) {
              console.log('✅ Releasing old slot:', slot);
              return {
                ...slot,
                status: 'available',
                patient: null,
                petId: null,
                veterinarian: null,
                vt_id: null,
                userId: null,
                appointmentType: null,
                description: null
              };
            }
            return slot;
          });

          const updateOldSlotsSQL = 'UPDATE clinic_slots_t SET slots = ?, last_updated = NOW() WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
          db.query(updateOldSlotsSQL, [JSON.stringify(updatedOldSlots), oldAppt.clinic_id, oldDateKey, oldAppt.consultation_type], (err3) => {
            if (!err3) {
              console.log(`✅ Released old slot for pet ${oldAppt.pet_id}`);
              io.emit('slotUpdated', { 
                clinic_id: oldAppt.clinic_id, 
                date: oldDateKey, 
                consultation_type: oldAppt.consultation_type,
                action: 'released' 
              });
            }
          });
        }

        // Step 4: Update NEW slot to pending
        const getNewSlotsSQL = 'SELECT slots FROM clinic_slots_t WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
        
        db.query(getNewSlotsSQL, [oldAppt.clinic_id, newDateKey, consultation_type], (err4, newSlotsResult) => {
          if (!err4 && newSlotsResult.length > 0) {
            let newSlots = newSlotsResult[0].slots;
            if (typeof newSlots === 'string') {
              try {
                newSlots = JSON.parse(newSlots);
              } catch (e) {
                console.error('⚠️ Error parsing new slots:', e);
              }
            }

            console.log('🔍 Looking for slot with time:', new_slot_time);

            // Get owner name for slot
            const getOwnerNameSQL = 'SELECT u.usr_firstName FROM user_t u WHERE u.usr_id = ?';
            
            db.query(getOwnerNameSQL, [oldAppt.owner_usr_id], (err5, ownerResult) => {
              const ownerFirstName = ownerResult && ownerResult.length > 0 ? ownerResult[0].usr_firstName : 'Unknown';
              const petOwnerName = `${ownerFirstName} - ${oldAppt.pet_name}`;

              // Find and update the new slot to pending
              const updatedNewSlots = newSlots.map(slot => {
                if (slot.time.trim() === new_slot_time.trim() && slot.status === 'available') {
                  console.log('✅ Found matching slot to book:', slot);
                  return {
                    ...slot,
                    status: 'pending',
                    patient: petOwnerName,
                    petId: oldAppt.pet_id,
                    userId: oldAppt.owner_usr_id,
                    appointmentType: appt_type,
                    description: appt_description
                  };
                }
                return slot;
              });

              const updateNewSlotsSQL = 'UPDATE clinic_slots_t SET slots = ?, last_updated = NOW() WHERE clinic_id = ? AND slot_date = ? AND consultation_type = ?';
              db.query(updateNewSlotsSQL, [JSON.stringify(updatedNewSlots), oldAppt.clinic_id, newDateKey, consultation_type], (err6) => {
                if (!err6) {
                  console.log(`✅ Set new slot to pending for pet ${oldAppt.pet_id}`);
                  io.emit('slotUpdated', { 
                    clinic_id: oldAppt.clinic_id, 
                    date: newDateKey, 
                    consultation_type: consultation_type,
                    action: 'booked' 
                  });
                }
              });
            });
          }

          // Step 5: NOW update appointment record (AFTER vet notification)
          // ✅ Keep status as 'scheduled' but with resched_flag
          const updateApptSQL = `
          UPDATE appointment_t
          SET appt_date = ?,
              appt_type = ?,
              consultation_type = ?,
              appt_description = ?,
              vt_id = NULL,
              resched_flag = 'yes',
              resched_reason = ?,
              updated_at = NOW()
          WHERE appt_id = ?
          `;

          db.query(updateApptSQL, [
          new_appt_date, 
          appt_type, 
          consultation_type, 
          appt_description, 
          reschedule_reason,
          apptId
          ], (err7) => {
            if (err7) {
              console.error('❌ Error updating appointment:', err7);
              return res.status(500).json({ error: 'Failed to reschedule appointment' });
            }

            console.log('✅ Appointment record updated with resched_flag and reason');

            // Step 6: Notify pet owner
            const ownerMsg = `Your appointment for ${oldAppt.pet_name} has been rescheduled to ${formattedNewDate} and is pending approval.`;
            createNotification(oldAppt.owner_usr_id, oldAppt.pet_id, apptId, 'pending', ownerMsg, new_appt_date);

            // Step 7: Notify vet admin
            const getVetAdminSQL = `
              SELECT u.usr_id 
              FROM vet_admin_t va
              INNER JOIN user_t u ON va.usr_id = u.usr_id
              INNER JOIN clinic_t c ON va.va_id = c.va_id
              WHERE c.clinic_id = ?
            `;
            db.query(getVetAdminSQL, [oldAppt.clinic_id], (err9, adminResult) => {
              if (!err9 && adminResult.length > 0) {
                const adminMsg = `${oldAppt.pet_name} has rescheduled their appointment from ${formattedOldDate} to ${formattedNewDate} and needs approval. Reason: "${reschedule_reason}"`;
                createNotification(adminResult[0].usr_id, oldAppt.pet_id, apptId, 'pending', adminMsg, new_appt_date);
              }
            });

            console.log(`✅ Appointment ${apptId} rescheduled successfully`);
            res.json({ message: 'Appointment rescheduled successfully' });
          });
        });
      });
    });
  });
});

// DELETE /api/appointments/:appt_id - Remove appointment from database
app.delete('/api/appointments/:appt_id', (req, res) => {
  const { appt_id } = req.params;

  const sql = 'DELETE FROM appointment_t WHERE appt_id = ?';

  db.query(sql, [appt_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting appointment:', err);
      return res.status(500).json({ error: 'Failed to delete appointment' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log(`✅ Appointment ${appt_id} deleted successfully`);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 ASSIGN VET TO APPOINTMENT
// -------------------------------------------------------------
app.put('/api/appointments/:appt_id/assign-vet', (req, res) => {
  const { appt_id } = req.params;
  const { vt_id } = req.body;

  if (!vt_id) {
    return res.status(400).json({ error: 'Veterinarian ID is required' });
  }

  const sql = `
    UPDATE appointment_t
    SET vt_id = ?, updated_at = NOW()
    WHERE appt_id = ?
  `;

  db.query(sql, [vt_id, appt_id], (err, result) => {
    if (err) {
      console.error('❌ Error assigning vet to appointment:', err);
      return res.status(500).json({ error: 'Failed to assign vet' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log(`✅ Vet ${vt_id} assigned to appointment ${appt_id}`);
    res.status(200).json({ message: 'Vet assigned successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 GET ALL PATIENTS FOR A SPECIFIC VETERINARIAN (by vt_id)
// -------------------------------------------------------------
app.get('/api/patients/vet/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  console.log("🐾 GET patients for veterinarian:", vt_id);

  const sql = `
    SELECT 
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_age,
      pet.pet_gender,
      pet.pet_breed,
      pet.pet_weight,
      pet.pet_hasVaccination,
      pet.pet_vaccinationDate,
      pet.pet_hasMedication,
      pet.pet_medicationDetails,
      pet.pet_hasAllergies,
      pet.pet_allergyDetails,
      pet.pet_dietType,
      pet.pet_behavioralNotes,
      pet.pet_lastUpdated,
      pet.pet_assignedVet,
      pp.pp_id,
      pp.pp_assignedClinic,
      pp.createdAt as pp_createdAt,
      u.usr_id,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName,
      u.usr_email as owner_email,
      vt.vt_id,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name,
      (SELECT appt_status FROM appointment_t 
       WHERE pet_id = pet.pet_id AND vt_id = ?
       ORDER BY created_at DESC LIMIT 1) as appt_status,
      (SELECT appt_id FROM appointment_t 
       WHERE pet_id = pet.pet_id AND vt_id = ?
       ORDER BY created_at DESC LIMIT 1) as appt_id
    FROM pet_t pet
    INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN veterinarian_t vt ON pet.pet_assignedVet = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE pet.pet_assignedVet = ?
    GROUP BY pet.pet_id
    ORDER BY pp.createdAt DESC
  `;

  db.query(sql, [vt_id, vt_id, vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching patients for vet:', err);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    console.log(`✅ Retrieved ${result.length} patients for veterinarian ${vt_id}`);
    console.log('📋 First patient (if any):', result[0]);
    res.status(200).json(result);
  });
});

// GET /api/appointments/vet/:vt_id
app.get('/api/appointments/vet/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.clinic_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.resched_flag,

      a.cancel_reason,
      a.cancel_by,
      a.cancel_dt,

      a.resched_flag,
      a.resched_reason,

      a.created_at,

      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_breed,
      pet.pet_age,
      pet.pet_gender,

      u.usr_id,
      u.usr_firstName AS owner_firstName,
      u.usr_lastName  AS owner_lastName,
      u.usr_email     AS owner_email,

      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) AS vet_name

    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    INNER JOIN pet_parent_t pp ON a.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id

    WHERE a.vt_id = ?
    ORDER BY a.appt_date ASC
  `;


  db.query(sql, [vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching vet appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    console.log(`✅ Retrieved ${result.length} appointments for vet ${vt_id}`);
    res.status(200).json(result);
  });
});

// POST /api/clinic-slots/generate-bulk/:clinic_id
app.post('/api/clinic-slots/generate-bulk/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const { startDate, endDate, slotDuration, consultationTypes } = req.body;

  if (!startDate || !endDate || !consultationTypes || consultationTypes.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get clinic hours first
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
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Generate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    // Prepare bulk insert data
    const slotsToInsert = [];
    let datesGenerated = 0;

    dates.forEach(date => {
      const dayName = daysOfWeek[date.getDay()];
      const dayHoursField = `${dayName}_hours`;
      let dayHours = hoursData[dayHoursField];

      // Parse if string
      if (typeof dayHours === 'string') {
        try {
          dayHours = JSON.parse(dayHours);
        } catch (e) {
          dayHours = null;
        }
      }

      // Skip if clinic is closed
      if (!dayHours || dayHours.status === 'Closed' || !dayHours.opening || !dayHours.closing) {
        return;
      }

      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // Generate slots for each consultation type
      consultationTypes.forEach(consultationType => {
        const slots = generateTimeSlotsWithInterval(dayHours.opening, dayHours.closing, slotDuration);
        slotsToInsert.push({
          clinic_id,
          slot_date: dateKey,
          consultation_type: consultationType,
          slots: JSON.stringify(slots)
        });
        datesGenerated++;
      });
    });

    if (slotsToInsert.length === 0) {
      return res.status(400).json({ error: 'No slots could be generated. Clinic may be closed on all selected dates.' });
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior
    const insertSQL = `
      INSERT INTO clinic_slots_t (clinic_id, slot_date, consultation_type, slots)
      VALUES ?
      ON DUPLICATE KEY UPDATE slots = VALUES(slots), last_updated = NOW()
    `;

    const values = slotsToInsert.map(s => [s.clinic_id, s.slot_date, s.consultation_type, s.slots]);

    db.query(insertSQL, [values], (err2) => {
      if (err2) {
        console.error('❌ Error bulk inserting slots:', err2);
        return res.status(500).json({ error: 'Failed to generate slots' });
      }

      const io = req.app.get('io');
      io.emit('slotUpdated', { clinic_id, action: 'bulk_generated' });

      console.log(`✅ Generated ${datesGenerated} slot sets for clinic ${clinic_id}`);
      res.status(200).json({ 
        message: 'Slots generated successfully',
        datesGenerated: dates.length,
        slotsGenerated: datesGenerated
      });
    });
  });
});

// -------------------------------------------------------------
// 🟢 GET USER NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/notifications/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  const sql = `
    SELECT 
      n.*,
      pet.pet_name,
      pet.pet_species
    FROM notification_t n
    LEFT JOIN pet_t pet ON n.pet_id = pet.pet_id
    WHERE n.usr_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching notifications:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    console.log(`✅ Retrieved ${result.length} notifications for user ${usr_id}`);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 MARK NOTIFICATION AS READ
// -------------------------------------------------------------
app.put('/api/notifications/:notification_id/read', (req, res) => {
  const { notification_id } = req.params;

  const sql = `
    UPDATE notification_t
    SET is_read = TRUE
    WHERE notification_id = ?
  `;

  db.query(sql, [notification_id], (err, result) => {
    if (err) {
      console.error('❌ Error marking notification as read:', err);
      return res.status(500).json({ error: 'Failed to update notification' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ Notification ${notification_id} marked as read`);
    res.status(200).json({ message: 'Notification marked as read' });
  });
});

// -------------------------------------------------------------
// 🟢 DELETE NOTIFICATION
// -------------------------------------------------------------
app.delete('/api/notifications/:notification_id', (req, res) => {
  const { notification_id } = req.params;

  const sql = 'DELETE FROM notification_t WHERE notification_id = ?';

  db.query(sql, [notification_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting notification:', err);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ Notification ${notification_id} deleted`);
    res.status(200).json({ message: 'Notification deleted' });
  });
});

// -------------------------------------------------------------
// 🟢 CREATE NOTIFICATION HELPER FUNCTION
// -------------------------------------------------------------
const createNotification = (usr_id, pet_id, appt_id, type, message, appt_date = null) => {
  const sql = `
    INSERT INTO notification_t (usr_id, pet_id, appt_id, notification_type, notification_message, appt_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [usr_id, pet_id, appt_id, type, message, appt_date], (err, result) => {
    if (err) {
      console.error('❌ Error creating notification:', err);
      return;
    }

    console.log(`✅ Notification created for user ${usr_id}, type: ${type}`);
    
    // Get io from app
    const ioInstance = app.get('io');
    
    if (!ioInstance) {
      console.error('❌ Socket.IO instance not found!');
      return;
    }

    // Get the full notification data with pet info
    const getNotificationSQL = `
      SELECT 
        n.*,
        pet.pet_name,
        pet.pet_species
      FROM notification_t n
      LEFT JOIN pet_t pet ON n.pet_id = pet.pet_id
      WHERE n.notification_id = ?
    `;
    
    db.query(getNotificationSQL, [result.insertId], (err2, notifResult) => {
      if (err2) {
        console.error('❌ Error fetching notification data:', err2);
        return;
      }

      if (notifResult.length > 0) {
        const notification = notifResult[0];
        console.log(`🔔 Emitting notification to user_${usr_id}:`, {
          type: notification.notification_type,
          message: notification.notification_message
        });
        
        // Emit to specific user room
        ioInstance.to(`user_${usr_id}`).emit('newNotification', notification);
        
        console.log(`✅ Notification emitted successfully to room: user_${usr_id}`);
      }
    });
  });
};

// -------------------------------------------------------------
// 🟢 MARK ALL NOTIFICATIONS AS READ FOR A USER
// -------------------------------------------------------------
app.put('/api/notifications/:usr_id/mark-all-read', (req, res) => {
  const { usr_id } = req.params;

  const sql = `
    UPDATE notification_t
    SET is_read = TRUE
    WHERE usr_id = ? AND is_read = FALSE
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error marking all notifications as read:', err);
      return res.status(500).json({ error: 'Failed to update notifications' });
    }

    console.log(`✅ Marked ${result.affectedRows} notifications as read for user ${usr_id}`);
    res.status(200).json({ 
      message: 'All notifications marked as read',
      count: result.affectedRows 
    });
  });
});

//Chat backend
// -------------------------------------------------------------
// 🟢 GET PATIENTS ASSIGNED TO SPECIFIC VET
// -------------------------------------------------------------
app.get('/api/vet-patients/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  // First, get the vet's usr_id
  const getUserIdSql = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
  
  db.query(getUserIdSql, [vt_id], (err, vetResult) => {
    if (err) {
      console.error('❌ Error fetching vet usr_id:', err);
      return res.status(500).json({ error: 'Failed to fetch vet info' });
    }
    
    if (vetResult.length === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }
    
    const vet_usr_id = vetResult[0].usr_id;
    console.log('🔍 Vet usr_id:', vet_usr_id); // Debug log

    const sql = `
    SELECT 
      pet.pet_id,
      pet.pet_name,
      pet.pet_species,
      pet.pet_age,
      pet.pet_gender,
      pet.pet_breed,
      pet.pet_weight,
      pet.pet_hasVaccination,
      pet.pet_vaccinationDate,
      pet.pet_hasMedication,
      pet.pet_medicationDetails,
      pet.pet_hasAllergies,
      pet.pet_allergyDetails,
      pet.pet_dietType,
      pet.pet_behavioralNotes,
      pet.pet_lastUpdated,
      pet.pet_image,
      pp.pp_id,
      pp.pp_assignedClinic,
      pp.createdAt as pp_createdAt,
      pp.usr_id as owner_usr_id,
      u.usr_id,
      u.usr_firstName as owner_firstName,
      u.usr_lastName as owner_lastName,
      u.usr_email as owner_email,
      u.usr_isOnline as owner_usr_isOnline,
      c.chat_id,
      c.last_msg,
      c.last_msg_at,
      COALESCE((SELECT COUNT(*) 
       FROM chat_msg_t cm 
       WHERE cm.chat_id = c.chat_id 
       AND cm.sender_id != ?
       AND cm.is_read = 'no'
      ), 0) as unread_count
    FROM pet_t pet
    INNER JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
    INNER JOIN user_t u ON pp.usr_id = u.usr_id
    LEFT JOIN chat_t c ON c.pp_id = pp.pp_id AND c.vt_id = pet.pet_assignedVet
    WHERE pet.pet_assignedVet = ?
    ORDER BY c.last_msg_at DESC, pet.pet_lastUpdated DESC
    `;

    db.query(sql, [vet_usr_id, vt_id], (err, result) => {
      if (err) {
        console.error('❌ Error fetching vet patients:', err);
        return res.status(500).json({ error: 'Failed to fetch vet patients' });
      }

      console.log(`✅ Retrieved ${result.length} patients for vet ${vt_id}`);
      // Debug: log unread counts
      result.forEach(r => {
        console.log(`Pet ${r.pet_name}: unread_count = ${r.unread_count}`);
      });
      
      res.status(200).json(result);
    });
  });
});

// GET /api/scheduled-appointment/:pet_id - Get scheduled appointment for chat view
app.get('/api/scheduled-appointment/:pet_id', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.consultation_type,
      a.appt_description,
      a.appt_date,
      a.appt_status,
      a.created_at,
      pet.pet_name,
      CONCAT(vu.usr_firstName, ' ', vu.usr_lastName) as vet_name
    FROM appointment_t a
    INNER JOIN pet_t pet ON a.pet_id = pet.pet_id
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
    WHERE a.pet_id = ? AND a.appt_status = 'scheduled'
    ORDER BY a.appt_date DESC
    LIMIT 1
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching appointment details:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment details' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'No scheduled appointment found' });
    }

    res.status(200).json(result[0]);
  });
});

// GET /api/last-completed-appointment/:pet_id - Get last completed appointment
app.get('/api/last-completed-appointment/:pet_id', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.appt_date,
      a.appt_status
    FROM appointment_t a
    WHERE a.pet_id = ? AND a.appt_status = 'completed'
    ORDER BY a.appt_date DESC
    LIMIT 1
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching last appointment:', err);
      return res.status(500).json({ error: 'Failed to fetch last appointment' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'No completed appointment found' });
    }

    res.status(200).json(result[0]);
  });
});

// GET /api/pets/by-parent/:pp_id - Get pets by pet parent ID (for chat)
app.get('/api/pets/by-parent/:pp_id', (req, res) => {
  const { pp_id } = req.params;

  console.log('🔍 Fetching pets for pp_id:', pp_id);

  // First, get the pet parent's usr_id
  const getUserIdSql = 'SELECT usr_id FROM pet_parent_t WHERE pp_id = ?';
  
  db.query(getUserIdSql, [pp_id], (err, ppResult) => {
    if (err) {
      console.error('❌ Error fetching pet parent usr_id:', err);
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }
    
    if (ppResult.length === 0) {
      return res.status(404).json({ error: 'Pet parent not found' });
    }
    
    const pp_usr_id = ppResult[0].usr_id;
    console.log('🔍 Pet parent usr_id:', pp_usr_id); // Debug log

    const sql = `
      SELECT 
        pet.*,
        pp.pp_assignedClinic,
        pp.createdAt as pp_createdAt,
        c.chat_id,
        c.last_msg,
        c.last_msg_at,
        vt.usr_id as vet_usr_id,
        vu.usr_isOnline as vet_usr_isOnline,
        COALESCE((SELECT COUNT(*) 
         FROM chat_msg_t cm 
         WHERE cm.chat_id = c.chat_id 
         AND cm.sender_id != ?
         AND cm.is_read = 'no'
        ), 0) as unread_count
      FROM pet_t pet
      LEFT JOIN pet_parent_t pp ON pet.pp_id = pp.pp_id
      LEFT JOIN chat_t c ON c.pp_id = pet.pp_id AND c.vt_id = pet.pet_assignedVet
      LEFT JOIN veterinarian_t vt ON pet.pet_assignedVet = vt.vt_id
      LEFT JOIN user_t vu ON vt.usr_id = vu.usr_id
      WHERE pet.pp_id = ?
      ORDER BY c.last_msg_at DESC, pet.pet_lastUpdated DESC
    `;

    db.query(sql, [pp_usr_id, pp_id], (err, result) => {
      if (err) {
        console.error('❌ Error fetching pets:', err);
        return res.status(500).json({ error: 'Failed to fetch pets' });
      }

      console.log(`✅ Query executed for pp_id: ${pp_id}`);
      console.log(`📊 Found ${result.length} pets`);
      // Debug: log unread counts
      result.forEach(r => {
        console.log(`Pet ${r.pet_name}: unread_count = ${r.unread_count}`);
      });
      
      res.status(200).json(result);
    });
  });
});

// GET /api/petparent/:usr_id - Get pet parent info
app.get('/api/petparent/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  const sql = `
    SELECT pp_id, usr_id, pp_assignedClinic, createdAt
    FROM pet_parent_t
    WHERE usr_id = ?
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching pet parent:', err);
      return res.status(500).json({ error: 'Failed to fetch pet parent' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Pet parent not found' });
    }

    console.log('✅ Pet parent fetched for usr_id:', usr_id, '→ pp_id:', result[0].pp_id);
    res.status(200).json(result[0]);
  });
});

// GET /api/veterinarian/:vt_id - Get vet info by vt_id
app.get('/api/veterinarian/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  const sql = `
    SELECT 
      vt.*,
      u.usr_firstName,
      u.usr_lastName,
      u.usr_email
    FROM veterinarian_t vt
    INNER JOIN user_t u ON vt.usr_id = u.usr_id
    WHERE vt.vt_id = ?
  `;

  db.query(sql, [vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching veterinarian:', err);
      return res.status(500).json({ error: 'Failed to fetch veterinarian' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }

    res.status(200).json(result[0]);
  });
});

// =============== CHAT ENDPOINTS ===============

// Get or create chat between pet parent and vet
app.post('/api/chat/get-or-create', (req, res) => {
  const { pp_id, vt_id } = req.body;
  
  // Check if chat exists
  db.query(
    'SELECT * FROM chat_t WHERE pp_id = ? AND vt_id = ?',
    [pp_id, vt_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        return res.json(results[0]);
      }
      
      // Create new chat
      db.query(
        'INSERT INTO chat_t (pp_id, vt_id) VALUES (?, ?)',
        [pp_id, vt_id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          
          db.query(
            'SELECT * FROM chat_t WHERE chat_id = ?',
            [result.insertId],
            (err, newChat) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json(newChat[0]);
            }
          );
        }
      );
    }
  );
});

// Get chat messages
app.get('/api/chat/:chat_id/messages', (req, res) => {
  const { chat_id } = req.params;
  
  db.query(
    `SELECT cm.*, u.usr_firstName, u.usr_lastName 
     FROM chat_msg_t cm
     JOIN user_t u ON cm.sender_id = u.usr_id
     WHERE cm.chat_id = ?
     ORDER BY cm.created_at ASC`,
    [chat_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Send message endpoint
app.post('/api/chat/send-message', (req, res) => {
  const io = req.app.get('io');
  const { chat_id, sender_id, sender_role, msg, msg_type = 'text' } = req.body;
  
  db.query(
    'INSERT INTO chat_msg_t (chat_id, sender_id, sender_role, msg, msg_type) VALUES (?, ?, ?, ?, ?)',
    [chat_id, sender_id, sender_role, msg, msg_type],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.query(
        'UPDATE chat_t SET last_msg = ?, last_msg_at = NOW() WHERE chat_id = ?',
        [msg, chat_id],
        (err) => {
          if (err) console.error('Error updating chat:', err);
        }
      );
      
      db.query(
        `SELECT cm.*, u.usr_firstName, u.usr_lastName 
         FROM chat_msg_t cm
         JOIN user_t u ON cm.sender_id = u.usr_id
         WHERE cm.msg_id = ?`,
        [result.insertId],
        (err, newMsg) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const message = newMsg[0];
          
          console.log('📤 About to emit newMessage to room:', `chat_${chat_id}`);
          console.log('📦 Message data:', message);
          
          // Emit to chat room
          io.to(`chat_${chat_id}`).emit('newMessage', { ...message, chat_id });

          //broadcast to ALL users so their lists update:
          io.emit('chatListUpdate', { 
            chat_id, 
            last_msg: msg, 
            last_msg_at: new Date(),
            sender_id 
          });
          
          console.log('✅ Emitted newMessage event');
          
          // In index.js, in the /api/chat/send-message endpoint, replace the notification section
          db.query(
            `SELECT c.pp_id, c.vt_id, pp.usr_id as pp_usr_id, vt.usr_id as vt_usr_id,
                    pet.pet_id, pet.pet_name
            FROM chat_t c
            JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
            JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
            LEFT JOIN pet_t pet ON pet.pp_id = c.pp_id AND pet.pet_assignedVet = c.vt_id
            WHERE c.chat_id = ?
            LIMIT 1`,
            [chat_id],
            (err, chatData) => {
              if (err || chatData.length === 0) return res.json(message);
              
              const receiverId = sender_role === 'pp' 
                ? chatData[0].vt_usr_id 
                : chatData[0].pp_usr_id;
              
              const senderName = `${message.usr_firstName} ${message.usr_lastName}`;
              
              console.log('📨 Checking notification for user:', receiverId);
              
              // ✅ CHECK if receiver is on chat page
              const usersOnChatPage = req.app.get('usersOnChatPage');
              const isReceiverOnChatPage = usersOnChatPage.get(receiverId.toString());
              
              console.log(`📍 Receiver ${receiverId} on chat page:`, isReceiverOnChatPage);
              
              // ✅ Only create database notification AND emit socket if receiver is NOT on chat page
              if (!isReceiverOnChatPage) {
                const pet_id = chatData[0].pet_id || null;
                const notificationMessage = `${senderName}: ${msg}`;  // ✅ CORRECT
                
                createNotification(
                  receiverId,
                  pet_id,
                  null,
                  'message',
                  notificationMessage,
                  null
                );
                
                io.to(`user_${receiverId}`).emit('newMessageNotification', {
                  senderName: senderName,
                  message: msg,  // ✅ CORRECT
                  chat_id: chat_id,
                  sender_id: sender_id
                });
              } else {
                console.log(`⏭️ Skipped notification - user ${receiverId} is on chat page`);
              }
              
              res.json(message);
            }
          );
        }
      );
    }
  );
});

// Mark messages as read
app.put('/api/chat/:chat_id/mark-read', (req, res) => {
  const { chat_id } = req.params;
  const { usr_id } = req.body;
  
  db.query(
    `UPDATE chat_msg_t 
     SET is_read = 'yes' 
     WHERE chat_id = ? AND sender_id != ? AND is_read = 'no'`,
    [chat_id, usr_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Update chat-specific online status
app.put('/api/chat/online-status', (req, res) => {
  const { chat_id, usr_id, is_online } = req.body;
  const io = req.app.get('io');
  
  db.query(
    `INSERT INTO chat_status_t (usr_id, chat_id, is_online, last_seen)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE is_online = ?, last_seen = NOW()`,
    [usr_id, chat_id, is_online, is_online],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      io.to(`chat_${chat_id}`).emit('statusChange', { usr_id, is_online });
      res.json({ success: true });
    }
  );
});

// =============== USER ONLINE STATUS ENDPOINTS ===============

// GET user online status
app.get('/api/user/online-status/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  
  console.log('📥 GET online status for usr_id:', usr_id);
  
  db.query(
    'SELECT usr_isOnline FROM user_t WHERE usr_id = ?',
    [usr_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: 'User not found' });
      
      console.log('✅ Found user status:', result[0]);
      
      res.json({ is_online: result[0].usr_isOnline === 'yes' });
    }
  );
});

// PUT user online status
app.put('/api/user/online-status', (req, res) => {
  const { usr_id, is_online } = req.body;
  const io = req.app.get('io');
  
  console.log('📥 Received online status update:', { usr_id, is_online });
  
  db.query(
    `UPDATE user_t SET usr_isOnline = ? WHERE usr_id = ?`,
    [is_online, usr_id],
    (err, result) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('✅ Update result:', result);
      console.log('📊 Rows changed:', result.changedRows);
      console.log('📊 Rows affected:', result.affectedRows);
      
      io.emit('userStatusChanged', { usr_id, is_online });
      res.json({ success: true });
    }
  );
});

// Get chat details including user IDs
app.get('/api/chat/:chat_id/details', (req, res) => {
  const { chat_id } = req.params;
  
  db.query(
    `SELECT c.*, pp.usr_id as pp_usr_id, vt.usr_id as vt_usr_id
     FROM chat_t c
     JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
     JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
     WHERE c.chat_id = ?`,
    [chat_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: 'Chat not found' });
      
      res.json(result[0]);
    }
  );
});

// Search messages across all chats for a user
app.get('/api/chat/search-messages', (req, res) => {
  const { query, usr_id, role } = req.query; // role = 'pp' or 'vt'
  
  if (!query || query.trim().length === 0) {
    return res.json([]);
  }

  const searchQuery = `%${query}%`;
  
  // Build SQL based on role
  const sql = role === 'pp' 
    ? `SELECT DISTINCT 
         cm.chat_id,
         cm.msg,
         cm.created_at,
         pet.pet_id,
         pet.pet_name,
         pet.pet_species,
         vt.vt_id,
         u.usr_firstName as vet_firstName,
         u.usr_lastName as vet_lastName,
         vt.vt_specialization
       FROM chat_msg_t cm
       JOIN chat_t c ON cm.chat_id = c.chat_id
       JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
       JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
       JOIN user_t u ON vt.usr_id = u.usr_id
       LEFT JOIN pet_t pet ON pet.pp_id = pp.pp_id AND pet.pet_assignedVet = vt.vt_id
       WHERE pp.usr_id = ? AND cm.msg LIKE ?
       ORDER BY cm.created_at DESC
       LIMIT 20`
    : `SELECT DISTINCT 
         cm.chat_id,
         cm.msg,
         cm.created_at,
         pet.pet_id,
         pet.pet_name,
         pet.pet_species,
         pp.pp_id,
         u.usr_firstName as owner_firstName,
         u.usr_lastName as owner_lastName
       FROM chat_msg_t cm
       JOIN chat_t c ON cm.chat_id = c.chat_id
       JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
       JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
       JOIN user_t u ON pp.usr_id = u.usr_id
       LEFT JOIN pet_t pet ON pet.pp_id = pp.pp_id AND pet.pet_assignedVet = vt.vt_id
       WHERE vt.usr_id = ? AND cm.msg LIKE ?
       ORDER BY cm.created_at DESC
       LIMIT 20`;

  db.query(sql, [usr_id, searchQuery], (err, results) => {
    if (err) {
      console.error('Error searching messages:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// GET /api/vet-unread-messages/:vt_id - Get total unread messages for a vet
app.get('/api/vet-unread-messages/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  // First get the vet's usr_id
  const getUserIdSql = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
  
  db.query(getUserIdSql, [vt_id], (err, vetResult) => {
    if (err) {
      console.error('❌ Error fetching vet usr_id:', err);
      return res.status(500).json({ error: 'Failed to fetch vet info' });
    }
    
    if (vetResult.length === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }
    
    const vet_usr_id = vetResult[0].usr_id;

    // Count unread messages across all chats for this vet
    const sql = `
      SELECT COUNT(*) as unread_count
      FROM chat_msg_t cm
      INNER JOIN chat_t c ON cm.chat_id = c.chat_id
      WHERE c.vt_id = ? 
      AND cm.sender_id != ?
      AND cm.is_read = 'no'
    `;

    db.query(sql, [vt_id, vet_usr_id], (err, result) => {
      if (err) {
        console.error('❌ Error counting unread messages:', err);
        return res.status(500).json({ error: 'Failed to count unread messages' });
      }

      console.log(`✅ Unread messages for vet ${vt_id}: ${result[0].unread_count}`);
      res.status(200).json({ unread_count: result[0].unread_count });
    });
  });
});


// GET /api/online-vets - Get available 24/7 online vets (excluding user's clinic)
app.get('/api/online-vets/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  // First get the user's registered clinic
  const getClinicSql = `
    SELECT pp.pp_assignedClinic 
    FROM pet_parent_t pp 
    WHERE pp.usr_id = ?
  `;

  db.query(getClinicSql, [usr_id], (err, clinicResult) => {
    if (err) {
      console.error('❌ Error fetching user clinic:', err);
      return res.status(500).json({ error: 'Failed to fetch user clinic' });
    }

    const userClinic = clinicResult.length > 0 ? clinicResult[0].pp_assignedClinic : null;

    // Get online vets from OTHER clinics
    const sql = `
      SELECT 
        vt.vt_id,
        vt.vt_specialization,
        vt.vt_clinicName,
        u.usr_id,
        u.usr_firstName,
        u.usr_lastName,
        u.usr_isOnline
      FROM veterinarian_t vt
      JOIN user_t u ON vt.usr_id = u.usr_id
      WHERE u.usr_isOnline = 'yes'
        AND vt.vt_onDutyToday = 'yes'
        AND vt.vt_available247 = 'yes'
        ${userClinic ? 'AND vt.vt_clinicName != ?' : ''}
      ORDER BY vt.vt_patientsAssigned ASC
      LIMIT 3
    `;

    const params = userClinic ? [userClinic] : [];

    db.query(sql, params, (err, vets) => {
      if (err) {
        console.error('❌ Error fetching online vets:', err);
        return res.status(500).json({ error: 'Failed to fetch online vets' });
      }

      console.log(`✅ Found ${vets.length} online vets (excluding clinic: ${userClinic})`);
      res.status(200).json(vets);
    });
  });
});

// POST /api/chat/start-24-7 - Start a 24/7 chat with available vet
app.post('/api/chat/start-24-7', (req, res) => {
  const { pp_id, vt_id } = req.body;

  // Check if chat already exists
  db.query(
    'SELECT * FROM chat_t WHERE pp_id = ? AND vt_id = ?',
    [pp_id, vt_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length > 0) {
        return res.json(results[0]);
      }

      // Create new 24/7 chat
      db.query(
        'INSERT INTO chat_t (pp_id, vt_id, chat_status, pp_online, vt_online) VALUES (?, ?, ?, ?, ?)',
        [pp_id, vt_id, 'active', 'yes', 'yes'],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          db.query(
            'SELECT * FROM chat_t WHERE chat_id = ?',
            [result.insertId],
            (err, newChat) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json(newChat[0]);
            }
          );
        }
      );
    }
  );
});

// GET /api/vet-24-7-chats/:vt_id - Get 24/7 consultation chats for a vet
app.get('/api/vet-24-7-chats/:vt_id', (req, res) => {
  const { vt_id } = req.params;

  // Get vet's usr_id first
  const getUserIdSql = 'SELECT usr_id FROM veterinarian_t WHERE vt_id = ?';
  
  db.query(getUserIdSql, [vt_id], (err, vetResult) => {
    if (err) {
      console.error('❌ Error fetching vet usr_id:', err);
      return res.status(500).json({ error: 'Failed to fetch vet info' });
    }
    
    if (vetResult.length === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }
    
    const vet_usr_id = vetResult[0].usr_id;

    const sql = `
      SELECT 
        c.chat_id,
        c.pp_id,
        c.vt_id,
        c.last_msg,
        c.last_msg_at,
        pp.usr_id as owner_usr_id,
        u.usr_firstName as owner_firstName,
        u.usr_lastName as owner_lastName,
        u.usr_isOnline as owner_usr_isOnline,
        COALESCE((SELECT COUNT(*) 
         FROM chat_msg_t cm 
         WHERE cm.chat_id = c.chat_id 
         AND cm.sender_id != ?
         AND cm.is_read = 'no'
        ), 0) as unread_count
      FROM chat_t c
      INNER JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
      INNER JOIN user_t u ON pp.usr_id = u.usr_id
      WHERE c.vt_id = ? 
      AND NOT EXISTS (
        SELECT 1 FROM pet_t pet 
        WHERE pet.pp_id = c.pp_id 
        AND pet.pet_assignedVet = c.vt_id
      )
      ORDER BY c.last_msg_at DESC
    `;

    db.query(sql, [vet_usr_id, vt_id], (err, result) => {
      if (err) {
        console.error('❌ Error fetching 24/7 consultations:', err);
        return res.status(500).json({ error: 'Failed to fetch consultations' });
      }

      console.log(`✅ Retrieved ${result.length} 24/7 consultations for vet ${vt_id}`);
      res.status(200).json(result);
    });
  });
});

// GET /api/petowner-24-7-chats/:pp_id - Get 24/7 consultation chats for a pet owner
app.get('/api/petowner-24-7-chats/:pp_id', (req, res) => {
  const { pp_id } = req.params;

  // Get pet owner's usr_id first
  const getUserIdSql = 'SELECT usr_id FROM pet_parent_t WHERE pp_id = ?';
  
  db.query(getUserIdSql, [pp_id], (err, ppResult) => {
    if (err) {
      console.error('❌ Error fetching pet owner usr_id:', err);
      return res.status(500).json({ error: 'Failed to fetch pet owner info' });
    }
    
    if (ppResult.length === 0) {
      return res.status(404).json({ error: 'Pet owner not found' });
    }
    
    const pp_usr_id = ppResult[0].usr_id;

    const sql = `
    SELECT 
      c.chat_id,
      c.pp_id,
      c.vt_id,
      c.last_msg,
      c.last_msg_at,
      vt.usr_id as vet_usr_id,
      u.usr_firstName as vet_firstName,
      u.usr_lastName as vet_lastName,
      u.usr_isOnline as vet_usr_isOnline,
      vt.vt_specialization,
      vt.vt_clinicName,
      vt.vt_available247,
      COALESCE((SELECT COUNT(*) 
      FROM chat_msg_t cm 
      WHERE cm.chat_id = c.chat_id 
      AND cm.sender_id != ?
      AND cm.is_read = 'no'
      ), 0) as unread_count
    FROM chat_t c
    INNER JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
    INNER JOIN user_t u ON vt.usr_id = u.usr_id
    WHERE c.pp_id = ? 
    AND NOT EXISTS (
      SELECT 1 FROM pet_t pet 
      WHERE pet.pp_id = c.pp_id 
      AND pet.pet_assignedVet = c.vt_id
    )
    ORDER BY c.last_msg_at DESC
  `;

    db.query(sql, [pp_usr_id, pp_id], (err, result) => {
      if (err) {
        console.error('❌ Error fetching 24/7 consultations:', err);
        return res.status(500).json({ error: 'Failed to fetch consultations' });
      }

      console.log(`✅ Retrieved ${result.length} 24/7 consultations for pet owner ${pp_id}`);
      res.status(200).json(result);
    });
  });
});

// PUT /api/vet/:vt_id/toggle-247-availability
app.put('/api/vet/:vt_id/toggle-247-availability', (req, res) => {
  const { vt_id } = req.params;
  const { available247 } = req.body;
  
  // Update the database
  const sql = 'UPDATE veterinarian_t SET vt_available247 = ? WHERE vt_id = ?';
  
  db.query(sql, [available247, vt_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating 24/7 availability:', err);
      return res.status(500).json({ error: 'Failed to update availability' });
    }

    // Optional: Check if vet existed
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Veterinarian not found' });
    }

    // ✅ FIX: Emit Socket.IO event to notify all connected clients
    io.emit('vetAvailabilityChanged', { 
      vt_id: parseInt(vt_id), 
      available247 
    });

    console.log(`🔄 Vet ${vt_id} availability changed to: ${available247}`);
    res.json({ message: 'Availability updated successfully' });
  });
});

// GET /api/vet/:vt_id/247-availability
app.get('/api/vet/:vt_id/247-availability', (req, res) => {
  const { vt_id } = req.params;

  const sql = 'SELECT vt_available247 FROM veterinarian_t WHERE vt_id = ?';
  
  db.query(sql, [vt_id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch availability' });
    }

    res.status(200).json({ available247: result[0].vt_available247 });
  });
});

// =============== FILE UPLOAD SETUP ===============
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pet image storage
const petImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const petUploadDir = path.join(__dirname, 'uploads', 'pets');
    if (!fs.existsSync(petUploadDir)) {
      fs.mkdirSync(petUploadDir, { recursive: true });
    }
    cb(null, petUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const petImageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
};

const uploadPetImage = multer({
  storage: petImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: petImageFilter
});

// Upload pet image
app.post('/api/pets/:pet_id/upload-image', uploadPetImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const { pet_id } = req.params;
  const imageUrl = `/uploads/pets/${req.file.filename}`;

  // Update pet with image URL
  const sql = 'UPDATE pet_t SET pet_image = ?, pet_lastUpdated = NOW() WHERE pet_id = ?';
  
  db.query(sql, [imageUrl, pet_id], (err, result) => {
    if (err) {
      console.error('Error updating pet image:', err);
      return res.status(500).json({ error: 'Failed to update pet image' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    console.log(`✅ Pet ${pet_id} image updated: ${imageUrl}`);
    res.status(200).json({ 
      message: 'Pet image uploaded successfully',
      imageUrl: imageUrl
    });
  });
});

// Delete pet image
app.delete('/api/pets/:pet_id/delete-image', (req, res) => {
  const { pet_id } = req.params;

  // Get current image path
  db.query('SELECT pet_image FROM pet_t WHERE pet_id = ?', [pet_id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: 'Failed to find pet' });
    }

    const imagePath = result[0].pet_image;
    
    // Delete from database
    db.query('UPDATE pet_t SET pet_image = NULL WHERE pet_id = ?', [pet_id], (err2) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to delete image' });
      }

      // Delete file from disk if exists
      if (imagePath) {
        const fullPath = path.join(__dirname, imagePath);
        fs.unlink(fullPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }

      res.status(200).json({ message: 'Pet image deleted successfully' });
    });
  });
});

// =============== FILE UPLOAD ENDPOINT ===============
app.post('/api/chat/upload-file', upload.single('file'), (req, res) => {
  const io = req.app.get('io');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { chat_id, sender_id, sender_role } = req.body;
  
  if (!chat_id || !sender_id || !sender_role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fileUrl = `/uploads/chat/${req.file.filename}`;
  const fileName = req.file.originalname;
  
  // Determine message type
  let msg_type = 'file';
  if (req.file.mimetype.startsWith('image/')) {
    msg_type = 'img';
  } else if (req.file.mimetype.startsWith('video/')) {
    msg_type = 'file';
  }

  // Insert into database
  db.query(
    'INSERT INTO chat_msg_t (chat_id, sender_id, sender_role, msg, msg_type) VALUES (?, ?, ?, ?, ?)',
    [chat_id, sender_id, sender_role, fileUrl, msg_type],
    (err, result) => {
      if (err) {
        console.error('Error saving file message:', err);
        return res.status(500).json({ error: 'Failed to save message' });
      }

      // Update last message
      const lastMsgText = msg_type === 'img' ? '📷 Photo' : `📎 ${fileName}`;
      db.query(
        'UPDATE chat_t SET last_msg = ?, last_msg_at = NOW() WHERE chat_id = ?',
        [lastMsgText, chat_id],
        (err) => {
          if (err) console.error('Error updating chat:', err);
        }
      );

      // Fetch the complete message WITH user info
      db.query(
        `SELECT cm.*, u.usr_firstName, u.usr_lastName 
         FROM chat_msg_t cm
         JOIN user_t u ON cm.sender_id = u.usr_id
         WHERE cm.msg_id = ?`,
        [result.insertId],
        (err, newMsg) => {
          if (err) return res.status(500).json({ error: err.message });

          const message = newMsg[0];

          console.log('📤 Emitting file message to chat room:', `chat_${chat_id}`);
          
          // ✅ CRITICAL: Emit to chat room so other user receives it in real-time
          io.to(`chat_${chat_id}`).emit('newMessage', { ...message, chat_id });

          // Broadcast chat list update
          io.emit('chatListUpdate', {
            chat_id,
            last_msg: lastMsgText,
            last_msg_at: new Date(),
            sender_id
          });

          console.log('✅ File message emitted successfully');

          // Send notifications
          db.query(
            `SELECT c.pp_id, c.vt_id, pp.usr_id as pp_usr_id, vt.usr_id as vt_usr_id,
                    pet.pet_id, pet.pet_name
            FROM chat_t c
            JOIN pet_parent_t pp ON c.pp_id = pp.pp_id
            JOIN veterinarian_t vt ON c.vt_id = vt.vt_id
            LEFT JOIN pet_t pet ON pet.pp_id = c.pp_id AND pet.pet_assignedVet = c.vt_id
            WHERE c.chat_id = ?
            LIMIT 1`,
            [chat_id],
            (err, chatData) => {
              if (err || chatData.length === 0) return res.json(message);

              const receiverId = sender_role === 'pp'
                ? chatData[0].vt_usr_id
                : chatData[0].pp_usr_id;

              const senderName = `${message.usr_firstName} ${message.usr_lastName}`;

              const usersOnChatPage = req.app.get('usersOnChatPage');
              const isReceiverOnChatPage = usersOnChatPage.get(receiverId.toString());

              if (!isReceiverOnChatPage) {
                const pet_id = chatData[0].pet_id || null;
                const notificationMessage = `${senderName}: ${lastMsgText}`;  // ✅ CORRECT
              
                createNotification(
                  receiverId,
                  pet_id,
                  null,
                  'message',
                  notificationMessage,
                  null
                );
              
                io.to(`user_${receiverId}`).emit('newMessageNotification', {
                  senderName: senderName,
                  message: lastMsgText,  // ✅ CORRECT
                  chat_id: chat_id,
                  sender_id: sender_id
                });
              }

              res.json(message);
            }
          );
        }
      );
    }
  );
});

// =============== VET REPLY TEMPLATES ENDPOINTS ===============

// Get all templates for a vet
app.get('/api/vet-templates/:vt_id', (req, res) => {
  const { vt_id } = req.params;
  
  const sql = `
    SELECT * FROM vet_reply_templates_t 
    WHERE vt_id = ? 
    ORDER BY usage_count DESC, category ASC
  `;
  
  db.query(sql, [vt_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching templates:', err);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
    res.json(results);
  });
});

// Create new template
app.post('/api/vet-templates', (req, res) => {
  const { vt_id, category, keywords, template_message } = req.body;
  
  if (!vt_id || !category || !keywords || !template_message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const sql = `
    INSERT INTO vet_reply_templates_t (vt_id, category, keywords, template_message)
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(sql, [vt_id, category, keywords, template_message], (err, result) => {
    if (err) {
      console.error('❌ Error creating template:', err);
      return res.status(500).json({ error: 'Failed to create template' });
    }
    
    res.status(201).json({ 
      message: 'Template created successfully',
      template_id: result.insertId 
    });
  });
});

// Update template
app.put('/api/vet-templates/:template_id', (req, res) => {
  const { template_id } = req.params;
  const { category, keywords, template_message, is_active } = req.body;
  
  const sql = `
    UPDATE vet_reply_templates_t 
    SET category = ?, keywords = ?, template_message = ?, is_active = ?
    WHERE template_id = ?
  `;
  
  db.query(sql, [category, keywords, template_message, is_active, template_id], (err) => {
    if (err) {
      console.error('❌ Error updating template:', err);
      return res.status(500).json({ error: 'Failed to update template' });
    }
    res.json({ message: 'Template updated successfully' });
  });
});

// Delete template
app.delete('/api/vet-templates/:template_id', (req, res) => {
  const { template_id } = req.params;
  
  db.query('DELETE FROM vet_reply_templates_t WHERE template_id = ?', [template_id], (err) => {
    if (err) {
      console.error('❌ Error deleting template:', err);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
    res.json({ message: 'Template deleted successfully' });
  });
});

// Analyze message and get suggestions
app.post('/api/vet-templates/analyze', (req, res) => {
  const { vt_id, message } = req.body;
  
  if (!vt_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Get active templates
  const sql = `
    SELECT * FROM vet_reply_templates_t 
    WHERE vt_id = ? AND is_active = 'yes'
    ORDER BY usage_count DESC
  `;
  
  db.query(sql, [vt_id], (err, templates) => {
    if (err) {
      console.error('❌ Error fetching templates:', err);
      return res.status(500).json({ error: 'Failed to analyze message' });
    }
    
    // Simple keyword matching algorithm
    const messageLower = message.toLowerCase();
    const suggestions = [];
    
    templates.forEach(template => {
      const keywords = template.keywords.toLowerCase().split(',').map(k => k.trim());
      let matchScore = 0;
      let matchedKeywords = [];
      
      keywords.forEach(keyword => {
        if (messageLower.includes(keyword)) {
          matchScore++;
          matchedKeywords.push(keyword);
        }
      });
      
      if (matchScore > 0) {
        suggestions.push({
          ...template,
          match_score: matchScore,
          matched_keywords: matchedKeywords
        });
      }
    });
    
    // Sort by match score and usage count
    suggestions.sort((a, b) => {
      if (b.match_score !== a.match_score) {
        return b.match_score - a.match_score;
      }
      return b.usage_count - a.usage_count;
    });
    
    // Return top 3 suggestions
    res.json(suggestions.slice(0, 3));
  });
});

// Log template usage
app.post('/api/vet-templates/log-usage', (req, res) => {
  const { template_id, vt_id, chat_id, msg_id, was_edited } = req.body;
  
  // Insert usage log
  const logSql = `
    INSERT INTO template_usage_log_t (template_id, vt_id, chat_id, msg_id, was_edited)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(logSql, [template_id, vt_id, chat_id, msg_id, was_edited], (err) => {
    if (err) {
      console.error('❌ Error logging usage:', err);
      return res.status(500).json({ error: 'Failed to log usage' });
    }
    
    // Increment usage count
    const updateSql = `
      UPDATE vet_reply_templates_t 
      SET usage_count = usage_count + 1 
      WHERE template_id = ?
    `;
    
    db.query(updateSql, [template_id], (err2) => {
      if (err2) console.error('❌ Error updating usage count:', err2);
      res.json({ message: 'Usage logged successfully' });
    });
  });
});

//REMINDERS BACKEND
// -------------------------------------------------------------
// 🟢 GET REMINDERS FOR PET PARENT
// -------------------------------------------------------------
app.get('/api/reminders/:pp_id', (req, res) => {
  const { pp_id } = req.params;

  const sql = `
    SELECT 
      r.rmd_id,
      r.pp_id,
      r.pet_id,
      r.rmd_title,
      r.rmd_desc,
      r.rmd_date,
      r.rmd_time,
      r.rmd_done,
      r.rmd_repeat,
      r.rmd_repeat_period,
      r.created_at,
      r.updated_at,
      pet.pet_name
    FROM pet_parent_rmd_t r
    LEFT JOIN pet_t pet ON r.pet_id = pet.pet_id
    WHERE r.pp_id = ?
    ORDER BY r.rmd_date ASC, r.rmd_time ASC
  `;

  db.query(sql, [pp_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching reminders:', err);
      return res.status(500).json({ error: 'Failed to fetch reminders' });
    }

    console.log(`✅ Retrieved ${result.length} reminders for pp_id ${pp_id}`);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 CREATE NEW REMINDER
// -------------------------------------------------------------
app.post('/api/reminders', (req, res) => {
  const {
    pp_id,
    pet_id,
    rmd_title,
    rmd_desc,
    rmd_date,
    rmd_time,
    rmd_repeat,
    rmd_repeat_period
  } = req.body;

  if (!pp_id || !rmd_title || !rmd_date || !rmd_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO pet_parent_rmd_t (
      pp_id,
      pet_id,
      rmd_title,
      rmd_desc,
      rmd_date,
      rmd_time,
      rmd_repeat,
      rmd_repeat_period
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    pp_id,
    pet_id || null,
    rmd_title,
    rmd_desc || null,
    rmd_date,
    rmd_time,
    rmd_repeat || 'no',
    rmd_repeat_period || ''
  ], (err, result) => {
    if (err) {
      console.error('❌ Error creating reminder:', err);
      return res.status(500).json({ error: 'Failed to create reminder' });
    }

    console.log('✅ Reminder created successfully, ID:', result.insertId);
    scheduleNextReminder();
    res.status(201).json({
      message: 'Reminder created successfully',
      rmd_id: result.insertId
    });
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE REMINDER
// -------------------------------------------------------------
app.put('/api/reminders/:rmd_id', (req, res) => {
  const { rmd_id } = req.params;
  const {
    pet_id,
    rmd_title,
    rmd_desc,
    rmd_date,
    rmd_time,
    rmd_repeat,
    rmd_repeat_period
  } = req.body;

  const sql = `
    UPDATE pet_parent_rmd_t
    SET 
      pet_id = ?,
      rmd_title = ?,
      rmd_desc = ?,
      rmd_date = ?,
      rmd_time = ?,
      rmd_repeat = ?,
      rmd_repeat_period = ?
    WHERE rmd_id = ?
  `;

  db.query(sql, [
    pet_id || null,
    rmd_title,
    rmd_desc || null,
    rmd_date,
    rmd_time,
    rmd_repeat || 'no',
    rmd_repeat_period || '',
    rmd_id
  ], (err, result) => {
    if (err) {
      console.error('❌ Error updating reminder:', err);
      return res.status(500).json({ error: 'Failed to update reminder' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    console.log('✅ Reminder updated successfully, ID:', rmd_id);
    scheduleNextReminder();
    res.status(200).json({ message: 'Reminder updated successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 TOGGLE REMINDER COMPLETION
// -------------------------------------------------------------
app.put('/api/reminders/:rmd_id/toggle', (req, res) => {
  const { rmd_id } = req.params;

  const sql = `
    UPDATE pet_parent_rmd_t
    SET rmd_done = IF(rmd_done = 'yes', 'no', 'yes')
    WHERE rmd_id = ?
  `;

  db.query(sql, [rmd_id], (err, result) => {
    if (err) {
      console.error('❌ Error toggling reminder:', err);
      return res.status(500).json({ error: 'Failed to toggle reminder' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    console.log('✅ Reminder toggled successfully, ID:', rmd_id);
    res.status(200).json({ message: 'Reminder status updated successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 DELETE REMINDER
// -------------------------------------------------------------
app.delete('/api/reminders/:rmd_id', (req, res) => {
  const { rmd_id } = req.params;

  const sql = 'DELETE FROM pet_parent_rmd_t WHERE rmd_id = ?';

  db.query(sql, [rmd_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting reminder:', err);
      return res.status(500).json({ error: 'Failed to delete reminder' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    console.log('✅ Reminder deleted successfully, ID:', rmd_id);
    scheduleNextReminder();
    res.status(200).json({ message: 'Reminder deleted successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 GET TODAY'S REMINDERS
// -------------------------------------------------------------
app.get('/api/reminders/:pp_id/today', (req, res) => {
  const { pp_id } = req.params;
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const sql = `
    SELECT 
      r.rmd_id,
      r.rmd_title,
      r.rmd_desc,
      r.rmd_date,
      r.rmd_time,
      r.rmd_done,
      r.rmd_repeat,
      r.rmd_repeat_period,
      pet.pet_name
    FROM pet_parent_rmd_t r
    LEFT JOIN pet_t pet ON r.pet_id = pet.pet_id
    WHERE r.pp_id = ? AND r.rmd_date = ?
    ORDER BY r.rmd_time ASC
  `;

  db.query(sql, [pp_id, todayStr], (err, result) => {
    if (err) {
      console.error('❌ Error fetching today\'s reminders:', err);
      return res.status(500).json({ error: 'Failed to fetch reminders' });
    }

    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 GET UPCOMING REMINDERS (next 7 days, excluding today)
// -------------------------------------------------------------
app.get('/api/reminders/:pp_id/upcoming', (req, res) => {
  const { pp_id } = req.params;
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  const sql = `
    SELECT 
      r.rmd_id,
      r.rmd_title,
      r.rmd_desc,
      r.rmd_date,
      r.rmd_time,
      r.rmd_done,
      r.rmd_repeat,
      r.rmd_repeat_period,
      pet.pet_name
    FROM pet_parent_rmd_t r
    LEFT JOIN pet_t pet ON r.pet_id = pet.pet_id
    WHERE r.pp_id = ? AND r.rmd_date > ? AND r.rmd_date <= ? AND r.rmd_done = 'no'
    ORDER BY r.rmd_date ASC, r.rmd_time ASC
    LIMIT 10
  `;

  db.query(sql, [pp_id, todayStr, nextWeekStr], (err, result) => {
    if (err) {
      console.error('❌ Error fetching upcoming reminders:', err);
      return res.status(500).json({ error: 'Failed to fetch reminders' });
    }

    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 GET REMINDERS WITH DATES (for calendar highlighting)
// -------------------------------------------------------------
app.get('/api/reminders/:pp_id/dates/:year/:month', (req, res) => {
  const { pp_id, year, month } = req.params;
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const sql = `
    SELECT DISTINCT DAY(rmd_date) as day
    FROM pet_parent_rmd_t
    WHERE pp_id = ? AND rmd_date BETWEEN ? AND ?
    ORDER BY day ASC
  `;

  db.query(sql, [pp_id, startDate, endDate], (err, result) => {
    if (err) {
      console.error('❌ Error fetching reminder dates:', err);
      return res.status(500).json({ error: 'Failed to fetch dates' });
    }

    const days = result.map(row => row.day);
    res.status(200).json({ days });
  });
});

// -------------------------------------------------------------
// 🟢 REMINDER NOTIFICATION SYSTEM - iPhone-style Scheduler
// -------------------------------------------------------------

let currentReminderTimeout = null;

const scheduleNextReminder = () => {
  if (currentReminderTimeout) {
    clearTimeout(currentReminderTimeout);
    currentReminderTimeout = null;
  }

  const sql = `
    SELECT 
      r.rmd_id,
      r.pp_id,
      r.pet_id,
      r.rmd_title,
      r.rmd_desc,
      r.rmd_date,
      r.rmd_time,
      r.rmd_repeat,
      r.rmd_repeat_period,
      r.last_fired_at,
      pp.usr_id,
      pet.pet_name
    FROM pet_parent_rmd_t r
    INNER JOIN pet_parent_t pp ON r.pp_id = pp.pp_id
    LEFT JOIN pet_t pet ON r.pet_id = pet.pet_id
    WHERE r.rmd_done = 'no'
      AND (r.last_fired_at IS NULL OR DATE(r.last_fired_at) < CURDATE())
    ORDER BY r.rmd_date ASC, r.rmd_time ASC
    LIMIT 1
  `;

  db.query(sql, [], (err, results) => {
    if (err) {
      console.error('❌ Error getting next reminder:', err);
      return;
    }

    if (results.length === 0) {
      console.log('📭 No upcoming reminders');
      return;
    }

    const reminder = results[0];
    const now = new Date();

    // Handle reminder.rmd_date whether it's a Date object or string
    let dueDateTime;
    if (reminder.rmd_date instanceof Date) {
      // It's already a Date object from MySQL
      const [hours, minutes] = reminder.rmd_time.split(':');
      dueDateTime = new Date(reminder.rmd_date);
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // It's a string
      const [year, month, day] = reminder.rmd_date.split('-');
      const [hours, minutes] = reminder.rmd_time.split(':');
      dueDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    const msUntilDue = dueDateTime.getTime() - now.getTime();

    if (msUntilDue <= 0) {
      console.log(`🔔 Overdue reminder, firing now: ${reminder.rmd_title}`);
      fireReminder(reminder);
      setTimeout(scheduleNextReminder, 1000);
      return;
    }

    console.log(`⏰ Next: "${reminder.rmd_title}" at ${dueDateTime.toLocaleString()} (in ${Math.round(msUntilDue/60000)} min)`);

    currentReminderTimeout = setTimeout(() => {
      fireReminder(reminder);
      scheduleNextReminder();
    }, msUntilDue);
  });
};

const fireReminder = (reminder) => {
  console.log(`🔔 FIRING: ${reminder.rmd_title}`);
  
  const petInfo = reminder.pet_name ? ` for ${reminder.pet_name}` : '';
  const message = `Reminder: ${reminder.rmd_title}${petInfo}`;
  
  createNotification(
    reminder.usr_id,
    reminder.pet_id,
    null,
    'reminder',
    message,
    null
  );

  // ✅ Record when this reminder was fired
  db.query(
    'UPDATE pet_parent_rmd_t SET last_fired_at = NOW() WHERE rmd_id = ?', 
    [reminder.rmd_id],
    (err) => {
      if (err) console.error('❌ Error updating last_fired_at:', err);
    }
  );

  // ✅ Handle recurring reminders - create next occurrence
  if (reminder.rmd_repeat === 'yes') {
    createNextRecurringReminder(reminder);
  }
};

setTimeout(() => {
  console.log('🚀 Starting reminder scheduler');
  scheduleNextReminder();
}, 5000);

// GET /api/reminders/:pp_id/by-date/:date - Get reminders for a specific date
app.get('/api/reminders/:pp_id/by-date/:date', (req, res) => {
  const { pp_id, date } = req.params;
  
  console.log('🔍 Fetching reminders for pp_id:', pp_id, 'date:', date);

  const sql = `
    SELECT 
      r.rmd_id,
      r.rmd_title,
      r.rmd_desc,
      r.rmd_date,
      r.rmd_time,
      r.rmd_done,
      r.rmd_repeat,
      r.rmd_repeat_period,
      pet.pet_name,
      DATE_FORMAT(r.rmd_date, '%Y-%m-%d') as formatted_date
    FROM pet_parent_rmd_t r
    LEFT JOIN pet_t pet ON r.pet_id = pet.pet_id
    WHERE r.pp_id = ? AND DATE(r.rmd_date) = ?
    ORDER BY r.rmd_time ASC
  `;

  db.query(sql, [pp_id, date], (err, result) => {
    if (err) {
      console.error('❌ Error fetching reminders by date:', err);
      return res.status(500).json({ error: 'Failed to fetch reminders' });
    }

    console.log(`✅ Retrieved ${result.length} reminders for date ${date}`);
    console.log('📋 Results:', result);
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 TRACKING & MONITORING ENDPOINTS
// -------------------------------------------------------------

// GET weight log for a pet
app.get('/api/pets/:pet_id/weight-log', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      weight_id,
      weight,
      rec_date,
      notes,
      created_at
    FROM pet_weight_log_t
    WHERE pet_id = ?
    ORDER BY rec_date DESC
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching weight log:', err);
      return res.status(500).json({ error: 'Failed to fetch weight log' });
    }
    res.status(200).json(result);
  });
});

// POST new weight entry
app.post('/api/pets/:pet_id/weight-log', (req, res) => {
  const { pet_id } = req.params;
  const { weight, rec_date, notes } = req.body;

  // Get pp_id from pet_id
  const getPpIdSQL = 'SELECT pp_id FROM pet_t WHERE pet_id = ?';
  
  db.query(getPpIdSQL, [pet_id], (err, ppResult) => {
    if (err || ppResult.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    const pp_id = ppResult[0].pp_id;

    const insertSQL = `
      INSERT INTO pet_weight_log_t (pet_id, pp_id, weight, rec_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertSQL, [pet_id, pp_id, weight, rec_date, notes || null], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating weight entry:', err2);
        return res.status(500).json({ error: 'Failed to create weight entry' });
      }

      console.log(`✅ Weight entry created for pet ${pet_id}`);
      res.status(201).json({ 
        message: 'Weight entry created successfully',
        weight_id: result.insertId 
      });
    });
  });
});

// GET activity log for a pet
app.get('/api/pets/:pet_id/activity-log', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      activity_id,
      activ_type,
      duration_min,
      activ_date,
      notes,
      created_at
    FROM pet_activity_log_t
    WHERE pet_id = ?
    ORDER BY activ_date DESC
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching activity log:', err);
      return res.status(500).json({ error: 'Failed to fetch activity log' });
    }
    res.status(200).json(result);
  });
});

// POST new activity entry
app.post('/api/pets/:pet_id/activity-log', (req, res) => {
  const { pet_id } = req.params;
  const { activityType, duration, activ_date, notes } = req.body;

  const getPpIdSQL = 'SELECT pp_id FROM pet_t WHERE pet_id = ?';
  
  db.query(getPpIdSQL, [pet_id], (err, ppResult) => {
    if (err || ppResult.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    const pp_id = ppResult[0].pp_id;

    const insertSQL = `
      INSERT INTO pet_activity_log_t (pet_id, pp_id, activ_type, duration_min, activ_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(insertSQL, [pet_id, pp_id, activityType, duration, activ_date, notes || null], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating activity entry:', err2);
        return res.status(500).json({ error: 'Failed to create activity entry' });
      }

      console.log(`✅ Activity entry created for pet ${pet_id}`);
      res.status(201).json({ 
        message: 'Activity entry created successfully',
        activity_id: result.insertId 
      });
    });
  });
});

// GET symptom log for a pet
app.get('/api/pets/:pet_id/symptom-log', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      symptom_id,
      symp_title,
      symp_desc,
      symp_date,
      created_at
    FROM pet_symptom_log_t
    WHERE pet_id = ?
    ORDER BY symp_date DESC
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching symptom log:', err);
      return res.status(500).json({ error: 'Failed to fetch symptom log' });
    }
    res.status(200).json(result);
  });
});

// POST new symptom entry
app.post('/api/pets/:pet_id/symptom-log', (req, res) => {
  const { pet_id } = req.params;
  const { symptomTitle, symptomDescription, symp_date } = req.body;

  const getPpIdSQL = 'SELECT pp_id FROM pet_t WHERE pet_id = ?';
  
  db.query(getPpIdSQL, [pet_id], (err, ppResult) => {
    if (err || ppResult.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    const pp_id = ppResult[0].pp_id;

    const insertSQL = `
      INSERT INTO pet_symptom_log_t (pet_id, pp_id, symp_title, symp_desc, symp_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertSQL, [pet_id, pp_id, symptomTitle, symptomDescription, symp_date], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating symptom entry:', err2);
        return res.status(500).json({ error: 'Failed to create symptom entry' });
      }

      console.log(`✅ Symptom entry created for pet ${pet_id}`);
      res.status(201).json({ 
        message: 'Symptom entry created successfully',
        symptom_id: result.insertId 
      });
    });
  });
});

// GET behavior log for a pet
app.get('/api/pets/:pet_id/behavior-log', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      behavior_id,
      behav_type,
      behav_note,
      behav_date,
      created_at
    FROM pet_behavior_log_t
    WHERE pet_id = ?
    ORDER BY behav_date DESC
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching behavior log:', err);
      return res.status(500).json({ error: 'Failed to fetch behavior log' });
    }
    res.status(200).json(result);
  });
});

// POST new behavior entry
app.post('/api/pets/:pet_id/behavior-log', (req, res) => {
  const { pet_id } = req.params;
  const { behaviorType, behaviorNote, behav_date } = req.body;

  const getPpIdSQL = 'SELECT pp_id FROM pet_t WHERE pet_id = ?';
  
  db.query(getPpIdSQL, [pet_id], (err, ppResult) => {
    if (err || ppResult.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    const pp_id = ppResult[0].pp_id;

    const insertSQL = `
      INSERT INTO pet_behavior_log_t (pet_id, pp_id, behav_type, behav_note, behav_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertSQL, [pet_id, pp_id, behaviorType, behaviorNote, behav_date], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating behavior entry:', err2);
        return res.status(500).json({ error: 'Failed to create behavior entry' });
      }

      console.log(`✅ Behavior entry created for pet ${pet_id}`);
      res.status(201).json({ 
        message: 'Behavior entry created successfully',
        behavior_id: result.insertId 
      });
    });
  });
});

// GET SOAP notes for a pet
app.get('/api/pets/:pet_id/soap-notes', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      soap_id,
      soap_date,
      subj,
      obj,
      assess,
      plan,
      created_at,
      updated_at
    FROM pet_owner_soap_t
    WHERE pet_id = ?
    ORDER BY soap_date DESC
  `;

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching SOAP notes:', err);
      return res.status(500).json({ error: 'Failed to fetch SOAP notes' });
    }
    res.status(200).json(result);
  });
});

// POST new SOAP note
app.post('/api/pets/:pet_id/soap-notes', (req, res) => {
  const { pet_id } = req.params;
  const { soap_date, subj, obj, assess, plan } = req.body;

  const getPpIdSQL = 'SELECT pp_id FROM pet_t WHERE pet_id = ?';
  
  db.query(getPpIdSQL, [pet_id], (err, ppResult) => {
    if (err || ppResult.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch pet parent info' });
    }

    const pp_id = ppResult[0].pp_id;

    const insertSQL = `
      INSERT INTO pet_owner_soap_t (pet_id, pp_id, soap_date, subj, obj, assess, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertSQL, [pet_id, pp_id, soap_date, subj, obj, assess, plan], (err2, result) => {
      if (err2) {
        console.error('❌ Error creating SOAP note:', err2);
        return res.status(500).json({ error: 'Failed to create SOAP note' });
      }

      console.log(`✅ SOAP note created for pet ${pet_id}`);
      res.status(201).json({ 
        message: 'SOAP note created successfully',
        soap_id: result.insertId 
      });
    });
  });
});

// -------------------------------------------------------------
// 🟢 VET HEALTH RECORDS ENDPOINTS
// -------------------------------------------------------------

// POST new examination/treatment
app.post('/api/pets/:pet_id/examinations', (req, res) => {
  const { pet_id } = req.params;
  const { appt_id, appt_type, appt_date, consultation_type, appt_description } = req.body;

  const sql = `
    INSERT INTO appointment_t (pet_id, appt_type, appt_date, consultation_type, appt_description, appt_status)
    VALUES (?, ?, ?, ?, ?, 'completed')
  `;

  db.query(sql, [pet_id, appt_type, appt_date, consultation_type, appt_description], (err, result) => {
    if (err) {
      console.error('❌ Error creating examination:', err);
      return res.status(500).json({ error: 'Failed to create examination' });
    }
    res.status(201).json({ message: 'Examination created', appt_id: result.insertId });
  });
});

// POST treatment for an examination
app.post('/api/examinations/:appt_id/treatments', (req, res) => {
  const { appt_id } = req.params;
  const { pet_id, treat_type, dose, freq, duration, notes } = req.body;

  const sql = `
    INSERT INTO pet_treatment_t (appt_id, pet_id, treat_type, dose, freq, duration, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [appt_id, pet_id, treat_type, dose, freq, duration, notes], (err, result) => {
    if (err) {
      console.error('❌ Error adding treatment:', err);
      return res.status(500).json({ error: 'Failed to add treatment' });
    }
    res.status(201).json({ message: 'Treatment added', treatment_id: result.insertId });
  });
});

// POST prescription for an examination
app.post('/api/examinations/:appt_id/prescriptions', (req, res) => {
  const { appt_id } = req.params;
  const { pet_id, med_name, dose, freq, duration, instructions, start_date, end_date } = req.body;

  const sql = `
    INSERT INTO pet_prescription_t (appt_id, pet_id, med_name, dose, freq, duration, instructions, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [appt_id, pet_id, med_name, dose, freq, duration, instructions, start_date, end_date], (err, result) => {
    if (err) {
      console.error('❌ Error adding prescription:', err);
      return res.status(500).json({ error: 'Failed to add prescription' });
    }
    res.status(201).json({ message: 'Prescription added', rx_id: result.insertId });
  });
});

// POST new vaccination
app.post('/api/pets/:pet_id/vaccinations', (req, res) => {
  const { pet_id } = req.params;
  const { vac_name, vac_date, next_date, vt_id, notes } = req.body;

  const sql = `
    INSERT INTO pet_vaccination_t (pet_id, vac_name, vac_date, next_date, vt_id, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [pet_id, vac_name, vac_date, next_date, vt_id, notes], (err, result) => {
    if (err) {
      console.error('❌ Error adding vaccination:', err);
      return res.status(500).json({ error: 'Failed to add vaccination' });
    }
    res.status(201).json({ message: 'Vaccination added', vac_id: result.insertId });
  });
});

// POST new condition
app.post('/api/pets/:pet_id/conditions', (req, res) => {
  const { pet_id } = req.params;
  const { cond_name, diag_date, status, notes } = req.body;

  const sql = `
    INSERT INTO pet_condition_t (pet_id, cond_name, diag_date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [pet_id, cond_name, diag_date, status || 'active', notes], (err, result) => {
    if (err) {
      console.error('❌ Error adding condition:', err);
      return res.status(500).json({ error: 'Failed to add condition' });
    }
    res.status(201).json({ message: 'Condition added', cond_id: result.insertId });
  });
});

// POST new surgery
app.post('/api/pets/:pet_id/surgeries', (req, res) => {
  const { pet_id } = req.params;
  const { surg_name, surg_date, vt_id, notes, complications } = req.body;

  const sql = `
    INSERT INTO pet_surgery_t (pet_id, surg_name, surg_date, vt_id, notes, complications)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [pet_id, surg_name, surg_date, vt_id, notes, complications], (err, result) => {
    if (err) {
      console.error('❌ Error adding surgery:', err);
      return res.status(500).json({ error: 'Failed to add surgery' });
    }
    res.status(201).json({ message: 'Surgery added', surg_id: result.insertId });
  });
});

// POST new document
app.post('/api/pets/:pet_id/documents', (req, res) => {
  const { pet_id } = req.params;
  const { appt_id, doc_title, doc_type, file_url } = req.body;

  const sql = `
    INSERT INTO pet_document_t (pet_id, appt_id, doc_title, doc_type, file_url)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [pet_id, appt_id || null, doc_title, doc_type, file_url], (err, result) => {
    if (err) {
      console.error('❌ Error adding document:', err);
      return res.status(500).json({ error: 'Failed to add document' });
    }
    res.status(201).json({ message: 'Document added', doc_id: result.insertId });
  });
});

// GET /api/pets/:pet_id/medical-history
app.get('/api/pets/:pet_id/medical-history', (req, res) => {
  const { pet_id } = req.params;

  // Query for documents
  const documentsSQL = `
    SELECT 
      doc_id as id,
      doc_title as title,
      doc_type as type,
      upload_date as date,
      file_url
    FROM pet_document_t
    WHERE pet_id = ?
    ORDER BY upload_date DESC
  `;

  // Query for vaccinations
  const vaccinationsSQL = `
    SELECT 
      vac_id,
      vac_name as vaccine,
      vac_date,
      next_date,
      notes,
      CONCAT(u.usr_firstName, ' ', u.usr_lastName) as vet
    FROM pet_vaccination_t pv
    LEFT JOIN veterinarian_t vt ON pv.vt_id = vt.vt_id
    LEFT JOIN user_t u ON vt.usr_id = u.usr_id
    WHERE pv.pet_id = ?
    ORDER BY vac_date DESC
  `;

  // Query for conditions
  const conditionsSQL = `
    SELECT 
      cond_id,
      cond_name as \`condition\`,
      diag_date,
      status,
      notes
    FROM pet_condition_t
    WHERE pet_id = ?
    ORDER BY diag_date DESC
  `;

  // Query for current medications (from prescriptions that are ongoing)
  const medicationsSQL = `
    SELECT 
      rx_id,
      med_name as medication,
      dose,
      freq as frequency,
      instructions,
      start_date,
      end_date
    FROM pet_prescription_t
    WHERE pet_id = ? 
    AND (end_date IS NULL OR end_date >= CURDATE())
    ORDER BY start_date DESC
  `;

  // Query for surgeries
  const surgeriesSQL = `
    SELECT 
      surg_id,
      surg_name as name,
      surg_date as date,
      notes,
      complications,
      CONCAT(u.usr_firstName, ' ', u.usr_lastName) as vet
    FROM pet_surgery_t ps
    LEFT JOIN veterinarian_t vt ON ps.vt_id = vt.vt_id
    LEFT JOIN user_t u ON vt.usr_id = u.usr_id
    WHERE ps.pet_id = ?
    ORDER BY surg_date DESC
  `;

  // Execute all queries
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(documentsSQL, [pet_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(vaccinationsSQL, [pet_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(conditionsSQL, [pet_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(medicationsSQL, [pet_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(surgeriesSQL, [pet_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
    .then(([documents, vaccinations, conditions, currentMedications, surgeries]) => {
      res.status(200).json({
        documents,
        vaccinations,
        conditions,
        currentMedications,
        surgeries
      });
    })
    .catch((err) => {
      console.error('❌ Error fetching medical history:', err);
      res.status(500).json({ error: 'Failed to fetch medical history' });
    });
});

// GET /api/pets/:pet_id/examinations
app.get('/api/pets/:pet_id/examinations', (req, res) => {
  const { pet_id } = req.params;

  // Get all appointments for this pet
  const appointmentsSQL = `
    SELECT 
      a.appt_id,
      a.appt_type,
      a.appt_date,
      a.consultation_type,
      a.appt_description,
      a.appt_status,
      CONCAT(u.usr_firstName, ' ', u.usr_lastName) as vet_name,
      c.clinic_name
    FROM appointment_t a
    LEFT JOIN veterinarian_t vt ON a.vt_id = vt.vt_id
    LEFT JOIN user_t u ON vt.usr_id = u.usr_id
    LEFT JOIN clinic_t c ON a.clinic_id = c.clinic_id
    WHERE a.pet_id = ?
    ORDER BY a.appt_date DESC
  `;

  db.query(appointmentsSQL, [pet_id], (err, appointments) => {
    if (err) {
      console.error('❌ Error fetching appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch examinations' });
    }

    // For each appointment, fetch treatments and prescriptions
    const promises = appointments.map(appt => {
      return Promise.all([
        // Get treatments
        new Promise((resolve, reject) => {
          const treatmentsSQL = `
            SELECT 
              treatment_id as treat_id,
              treat_type as type,
              dose,
              freq as frequency,
              duration,
              notes
            FROM pet_treatment_t
            WHERE appt_id = ?
          `;
          db.query(treatmentsSQL, [appt.appt_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        // Get prescriptions
        new Promise((resolve, reject) => {
          const prescriptionsSQL = `
            SELECT 
              rx_id,
              med_name as medication,
              dose,
              freq as frequency,
              duration,
              instructions,
              start_date,
              end_date
            FROM pet_prescription_t
            WHERE appt_id = ?
          `;
          db.query(prescriptionsSQL, [appt.appt_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      ]).then(([treatments, prescriptions]) => {
        return {
          ...appt,
          treatments,
          prescriptions
        };
      });
    });

    Promise.all(promises)
      .then(results => {
        res.status(200).json(results);
      })
      .catch(err => {
        console.error('❌ Error fetching treatments/prescriptions:', err);
        res.status(500).json({ error: 'Failed to fetch examination details' });
      });
  });
});

// GET /api/pets/:pet_id/all-medications
app.get('/api/pets/:pet_id/all-medications', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      rx_id,
      med_name as medication,
      dose,
      freq as frequency,
      duration,
      instructions,
      start_date,
      end_date,
      created_at
    FROM pet_prescription_t
    WHERE pet_id = ?
    ORDER BY start_date DESC, created_at DESC
  `;

  db.query(sql, [pet_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching all medications:', err);
      return res.status(500).json({ error: 'Failed to fetch medications' });
    }
    res.status(200).json(results);
  });
});

// GET /api/pets/:pet_id/all-treatments
app.get('/api/pets/:pet_id/all-treatments', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      t.treatment_id,
      t.treat_type as type,
      t.dose,
      t.freq as frequency,
      t.duration,
      t.notes,
      t.admin_at as admin_date,
      a.appt_date
    FROM pet_treatment_t t
    LEFT JOIN appointment_t a ON t.appt_id = a.appt_id
    WHERE t.pet_id = ?
    ORDER BY a.appt_date DESC, t.admin_at DESC
  `;

  db.query(sql, [pet_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching all treatments:', err);
      return res.status(500).json({ error: 'Failed to fetch treatments' });
    }
    res.status(200).json(results);
  });
});

// GET /api/pets/:pet_id/soap-notes
app.get('/api/pets/:pet_id/soap-notes', (req, res) => {
  const { pet_id } = req.params;

  const sql = `
    SELECT 
      soap_id,
      soap_date,
      subj,
      obj,
      assess,
      plan,
      created_at,
      updated_at
    FROM pet_owner_soap_t
    WHERE pet_id = ?
    ORDER BY soap_date DESC
  `;

  db.query(sql, [pet_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching SOAP notes:', err);
      return res.status(500).json({ error: 'Failed to fetch SOAP notes' });
    }
    res.status(200).json(results);
  });
});
// PUT update examination
app.put('/api/examinations/:appt_id', (req, res) => {
  const { appt_id } = req.params;
  const { appt_type, appt_description, appt_status } = req.body;

  const sql = `
    UPDATE appointment_t 
    SET appt_type = ?, appt_description = ?, appt_status = ?
    WHERE appt_id = ?
  `;

  db.query(sql, [appt_type, appt_description, appt_status, appt_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating examination:', err);
      return res.status(500).json({ error: 'Failed to update examination' });
    }
    res.status(200).json({ message: 'Examination updated successfully' });
  });
});

// PUT update treatment
app.put('/api/treatments/:treat_id', (req, res) => {
  const { treat_id } = req.params;
  const { treat_type, dose, freq, duration, notes } = req.body;

  const sql = `
    UPDATE pet_treatment_t 
    SET treat_type = ?, dose = ?, freq = ?, duration = ?, notes = ?
    WHERE treatment_id = ?
  `;

  db.query(sql, [treat_type, dose, freq, duration, notes, treat_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating treatment:', err);
      return res.status(500).json({ error: 'Failed to update treatment' });
    }
    res.status(200).json({ message: 'Treatment updated successfully' });
  });
});

// PUT update prescription
app.put('/api/prescriptions/:rx_id', (req, res) => {
  const { rx_id } = req.params;
  const { med_name, dose, freq, duration, instructions, start_date, end_date } = req.body;

  const formattedStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;
  const formattedEndDate = end_date ? new Date(end_date).toISOString().split('T')[0] : null;

  const sql = `
    UPDATE pet_prescription_t 
    SET med_name = ?, dose = ?, freq = ?, duration = ?, instructions = ?, start_date = ?, end_date = ?
    WHERE rx_id = ?
  `;

  db.query(sql, [med_name, dose, freq, duration, instructions, formattedStartDate, formattedEndDate, rx_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating prescription:', err);
      return res.status(500).json({ error: 'Failed to update prescription' });
    }
    res.status(200).json({ message: 'Prescription updated successfully' });
  });
});

// PUT update vaccination
app.put('/api/vaccinations/:vac_id', (req, res) => {
  const { vac_id } = req.params;
  const { vac_name, vac_date, next_date, notes } = req.body;

  const formattedVacDate = vac_date ? new Date(vac_date).toISOString().split('T')[0] : null;
  const formattedNextDate = next_date ? new Date(next_date).toISOString().split('T')[0] : null;

  const sql = `
    UPDATE pet_vaccination_t 
    SET vac_name = ?, vac_date = ?, next_date = ?, notes = ?
    WHERE vac_id = ?
  `;

  db.query(sql, [vac_name, formattedVacDate, formattedNextDate, notes, vac_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating vaccination:', err);
      return res.status(500).json({ error: 'Failed to update vaccination' });
    }
    res.status(200).json({ message: 'Vaccination updated successfully' });
  });
});

// PUT update document
app.put('/api/documents/:doc_id', (req, res) => {
  const { doc_id } = req.params;
  const { doc_title, doc_type, file_url } = req.body;

  const sql = `
    UPDATE pet_document_t 
    SET doc_title = ?, doc_type = ?, file_url = ?
    WHERE doc_id = ?
  `;

  db.query(sql, [doc_title, doc_type, file_url, doc_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating document:', err);
      return res.status(500).json({ error: 'Failed to update document' });
    }
    res.status(200).json({ message: 'Document updated successfully' });
  });
});

// PUT update condition
app.put('/api/conditions/:cond_id', (req, res) => {
  const { cond_id } = req.params;
  const { cond_name, diag_date, status, notes } = req.body;

  const formattedDiagDate = diag_date ? new Date(diag_date).toISOString().split('T')[0] : null;

  const sql = `
    UPDATE pet_condition_t 
    SET cond_name = ?, diag_date = ?, status = ?, notes = ?
    WHERE cond_id = ?
  `;

  db.query(sql, [cond_name, formattedDiagDate, status, notes, cond_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating condition:', err);
      return res.status(500).json({ error: 'Failed to update condition' });
    }
    res.status(200).json({ message: 'Condition updated successfully' });
  });
});

// PUT update surgery
app.put('/api/surgeries/:surg_id', (req, res) => {
  const { surg_id } = req.params;
  const { surg_name, surg_date, notes, complications } = req.body;

  const formattedDate = surg_date ? new Date(surg_date).toISOString().split('T')[0] : null;

  const sql = `
    UPDATE pet_surgery_t 
    SET surg_name = ?, surg_date = ?, notes = ?, complications = ?
    WHERE surg_id = ?
  `;

  db.query(sql, [surg_name, formattedDate, notes, complications, surg_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating surgery:', err);
      return res.status(500).json({ error: 'Failed to update surgery' });
    }
    res.status(200).json({ message: 'Surgery updated successfully' });
  });
});

// Upload pet document
app.post('/api/pets/upload-document', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { pet_id, doc_title, doc_type } = req.body;
  
  if (!pet_id || !doc_title || !doc_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fileUrl = `/uploads/chat/${req.file.filename}`;

  const sql = `
    INSERT INTO pet_document_t (pet_id, doc_title, doc_type, file_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [pet_id, doc_title, doc_type, fileUrl], (err, result) => {
    if (err) {
      console.error('❌ Error saving document:', err);
      return res.status(500).json({ error: 'Failed to save document' });
    }

    console.log(`✅ Document uploaded for pet ${pet_id}: ${doc_title}`);
    res.status(201).json({ 
      message: 'Document uploaded successfully',
      doc_id: result.insertId,
      file_url: fileUrl
    });
  });
});

// DELETE vaccination
app.delete('/api/vaccinations/:vac_id', (req, res) => {
  const { vac_id } = req.params;
  db.query('DELETE FROM pet_vaccination_t WHERE vac_id = ?', [vac_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete vaccination' });
    res.json({ message: 'Vaccination deleted successfully' });
  });
});

// DELETE document
app.delete('/api/documents/:doc_id', (req, res) => {
  const { doc_id } = req.params;
  db.query('DELETE FROM pet_document_t WHERE doc_id = ?', [doc_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete document' });
    res.json({ message: 'Document deleted successfully' });
  });
});

// DELETE condition
app.delete('/api/conditions/:cond_id', (req, res) => {
  const { cond_id } = req.params;
  db.query('DELETE FROM pet_condition_t WHERE cond_id = ?', [cond_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete condition' });
    res.json({ message: 'Condition deleted successfully' });
  });
});

// DELETE surgery
app.delete('/api/surgeries/:surg_id', (req, res) => {
  const { surg_id } = req.params;
  db.query('DELETE FROM pet_surgery_t WHERE surg_id = ?', [surg_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete surgery' });
    res.json({ message: 'Surgery deleted successfully' });
  });
});

// DELETE treatment
app.delete('/api/treatments/:treat_id', (req, res) => {
  const { treat_id } = req.params;
  db.query('DELETE FROM pet_treatment_t WHERE treatment_id = ?', [treat_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete treatment' });
    res.json({ message: 'Treatment deleted successfully' });
  });
});

// DELETE prescription
app.delete('/api/prescriptions/:rx_id', (req, res) => {
  const { rx_id } = req.params;
  db.query('DELETE FROM pet_prescription_t WHERE rx_id = ?', [rx_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete prescription' });
    res.json({ message: 'Prescription deleted successfully' });
  });
});