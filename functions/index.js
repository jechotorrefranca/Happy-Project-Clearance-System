const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.createUserByAdmin = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) {
        return res.status(401).json({error: "Unauthorized"});
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const {email, password, role, department, educationLevel} = req.body;

      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
      });

      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        role: role,
        department: department || null,
        educationLevel: educationLevel || null,
        isLocked: false,
        failedSignInAttempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: decodedToken.uid,
      });

      if (role === "student") {
        await admin.firestore().collection("students").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: email,
          fullName: "",
          studentId: "",
          gradeLevel: "",
          section: "",
          educationLevel: educationLevel || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (role === "faculty") {
        await admin.firestore().collection("teachers").doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: email,
          name: "",
          department: department || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await admin.firestore().collection("auditLogs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: decodedToken.uid,
        actionType: "create_user",
        email: decodedToken.email,
        details: {
          createdUserEmail: email,
          createdUserRole: role,
          createdUserUid: userRecord.uid,
          educationLevel: educationLevel,
          department: department || null,
        },
      });

      return res.status(200).json({
        success: true,
        uid: userRecord.uid,
        message: "User created successfully",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({error: error.message});
    }
  });
});
