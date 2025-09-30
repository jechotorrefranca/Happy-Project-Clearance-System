import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  X,
  RefreshCw,
  MessageSquare,
  File,
  Download,
  ArrowLeft,
  Info,
  Plus,
  Users,
  Mail,
} from "lucide-react";

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const NewConversationModal = ({ isOpen, onClose, onStartConversation, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setSearchLoading(true);
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: "student",
        ...doc.data(),
      }));

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs
        .filter(doc => doc.id !== currentUser?.uid)
        .map((doc) => ({
          id: doc.id,
          type: "user",
          ...doc.data(),
        }));

      setUsers([...studentsData, ...usersData]);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users.slice(0, 10);
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.studentId?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [searchQuery, users]);

  const handleStartConversation = async () => {
    if (!selectedUser || !subject.trim() || !message.trim()) {
      alert("Please select a user and fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await onStartConversation({
        recipientId: selectedUser.uid || selectedUser.id,
        recipientInfo: selectedUser,
        subject: subject.trim(),
        message: message.trim(),
      });
      
      setSelectedUser(null);
      setSubject("");
      setMessage("");
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            
            {}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedUser?.id === user.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          user.type === "student" 
                            ? "bg-gradient-to-br from-green-400 to-green-600"
                            : "bg-gradient-to-br from-purple-400 to-purple-600"
                        }`}>
                          {getInitials(user.fullName || user.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.fullName || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            {user.type === "student" && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Student
                              </span>
                            )}
                            {user.gradeLevel && (
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                Grade {user.gradeLevel}
                              </span>
                            )}
                            {user.role && (
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                {user.role}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          {selectedUser && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  selectedUser.type === "student"
                    ? "bg-gradient-to-br from-green-400 to-green-600"
                    : "bg-gradient-to-br from-purple-400 to-purple-600"
                }`}>
                  {getInitials(selectedUser.fullName || selectedUser.email)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {selectedUser.fullName || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          )}

          {}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter conversation subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartConversation}
              disabled={!selectedUser || !subject.trim() || !message.trim() || loading}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                !selectedUser || !subject.trim() || !message.trim() || loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Start Conversation
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MessageBubble = React.memo(({ message, isOwn, activeConversation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`flex max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"} gap-2`}>
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm flex-shrink-0 mt-auto">
            {getInitials(activeConversation?.studentInfo?.fullName || activeConversation?.recipientInfo?.fullName)}
          </div>
        )}

        <div>
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.message}</p>

            {message.fileURLs && message.fileURLs.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.fileURLs.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded ${
                      isOwn
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    } transition-colors`}
                  >
                    <File className="w-4 h-4" />
                    <span className="text-sm">Attachment {index + 1}</span>
                    <Download className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className="text-xs text-gray-500">
              {moment(message.timestamp).format("HH:mm")}
            </span>
            {isOwn && (
              <span className="text-xs text-gray-500">
                {message.read ? <CheckCheck className="w-4 h-4 text-blue-500" /> : <Check className="w-4 h-4" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const ConversationItem = React.memo(({ conversation, isActive, onClick }) => {
  const getUserInfo = () => {
    return conversation.studentInfo || conversation.recipientInfo || {};
  };

  const userInfo = getUserInfo();

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-gray-100 transition-colors ${
        isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
            {getInitials(userInfo.fullName || userInfo.email)}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
              {conversation.unreadCount}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {userInfo.fullName || "Unknown User"}
            </h4>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {moment(conversation.lastTimestamp).fromNow()}
            </span>
          </div>

          <p className="text-sm text-gray-600 truncate mb-1">
            {conversation.subject}
          </p>

          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage}
          </p>

          {(userInfo.gradeLevel || userInfo.section) && (
            <div className="flex gap-2 mt-2">
              {userInfo.gradeLevel && (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  Grade {userInfo.gradeLevel}
                </span>
              )}
              {userInfo.section && (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {userInfo.section}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function ViewMessages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowConversationList(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);

    const inquiriesRef = collection(db, "inquiries");
    const qRef = query(
      inquiriesRef,
      where("fixedFacultyId", "==", currentUser.uid)
    );

    const userCache = new Map();

    const unsubscribe = onSnapshot(qRef, async (snapshot) => {
      const inquiriesData = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();

          let userInfo = userCache.get(data.fixedStudentId || data.recipientId);
          
          if (!userInfo) {
            if (data.fixedStudentId) {
              const studentsRef = collection(db, "students");
              const studentQuery = query(
                studentsRef,
                where("uid", "==", data.fixedStudentId)
              );
              const studentSnapshot = await getDocs(studentQuery);

              if (!studentSnapshot.empty) {
                userInfo = {
                  ...studentSnapshot.docs[0].data(),
                  type: "student"
                };
              }
            }

            if (!userInfo && data.recipientId) {
              const usersRef = collection(db, "users");
              const userDoc = await getDocs(query(usersRef, where("__name__", "==", data.recipientId)));
              
              if (!userDoc.empty) {
                userInfo = {
                  ...userDoc.docs[0].data(),
                  type: "user"
                };
              }
            }

            if (!userInfo) {
              userInfo = {
                fullName: data.recipientName || "Unknown User",
                email: data.recipientEmail || "",
                type: "unknown"
              };
            }

            userCache.set(data.fixedStudentId || data.recipientId, userInfo);
          }

          return {
            id: d.id,
            ...data,
            studentInfo: userInfo,
            recipientInfo: userInfo,
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        })
      );

      const conversationMap = new Map();
      inquiriesData.forEach((inquiry) => {
        const recipientId = inquiry.fixedStudentId || inquiry.recipientId;
        const key = `${inquiry.subject}-${recipientId}`;
        const isUnread =
          inquiry.recipientId === currentUser.uid && !inquiry.read;

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            subject: inquiry.subject,
            studentId: recipientId,
            recipientId: recipientId,
            studentInfo: inquiry.studentInfo,
            recipientInfo: inquiry.recipientInfo,
            lastMessage: inquiry.message,
            lastTimestamp: inquiry.timestamp,
            unreadCount: isUnread ? 1 : 0,
            messages: [inquiry],
          });
        } else {
          const existing = conversationMap.get(key);
          existing.messages.push(inquiry);
          if (inquiry.timestamp > existing.lastTimestamp) {
            existing.lastMessage = inquiry.message;
            existing.lastTimestamp = inquiry.timestamp;
          }
          if (isUnread) existing.unreadCount += 1;
        }
      });

      const conversationsList = Array.from(conversationMap.values()).sort(
        (a, b) => b.lastTimestamp - a.lastTimestamp
      );

      setConversations(conversationsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  useEffect(() => {
    if (
      !activeConversation?.subject ||
      !activeConversation?.recipientId ||
      !currentUser?.uid
    )
      return;

    const qRef = query(
      collection(db, "inquiries"),
      where("subject", "==", activeConversation.subject),
      where("fixedStudentId", "==", activeConversation.recipientId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(qRef, async (snapshot) => {
      const messagesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date(),
      }));

      setMessages(messagesData);

      const updates = snapshot.docs
        .filter((docSnap) => {
          const data = docSnap.data();
          return data.recipientId === currentUser.uid && !data.read;
        })
        .map((docSnap) =>
          updateDoc(doc(db, "inquiries", docSnap.id), { read: true })
        );

      if (updates.length) await Promise.all(updates);

      setTimeout(scrollToBottom, 50);
    });

    return unsubscribe;
  }, [
    activeConversation?.subject,
    activeConversation?.recipientId,
    currentUser?.uid,
  ]);

  const filteredConversations = useMemo(() => {
    if (searchQuery) {
      return conversations.filter((conv) => {
        const searchLower = searchQuery.toLowerCase();
        const userInfo = conv.studentInfo || conv.recipientInfo || {};
        return (
          userInfo.fullName?.toLowerCase().includes(searchLower) ||
          conv.subject?.toLowerCase().includes(searchLower) ||
          conv.lastMessage?.toLowerCase().includes(searchLower)
        );
      });
    }
    return conversations;
  }, [searchQuery, conversations]);

  const handleStartNewConversation = async ({ recipientId, recipientInfo, subject, message }) => {
    try {
      await addDoc(collection(db, "inquiries"), {
        studentId: currentUser.uid,
        recipientId: recipientId,
        fixedStudentId: recipientId,
        fixedFacultyId: currentUser.uid,
        facultyEmail: currentUser.email,
        recipientName: recipientInfo.fullName,
        recipientEmail: recipientInfo.email,
        subject: subject,
        message: message,
        fileURLs: [],
        timestamp: serverTimestamp(),
        read: false,
      });

      const newConversation = {
        subject: subject,
        studentId: recipientId,
        recipientId: recipientId,
        studentInfo: recipientInfo,
        recipientInfo: recipientInfo,
        lastMessage: message,
        lastTimestamp: new Date(),
        unreadCount: 0,
      };

      setActiveConversation(newConversation);
      if (isMobile) {
        setShowConversationList(false);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!activeConversation || !currentUser) return;

    const text = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: `optimistic-${clientId}`,
      clientId,
      message: text,
      fileURLs: [],
      timestamp: new Date(),
      studentId: currentUser.uid,
      recipientId: activeConversation.recipientId,
      read: false,
      __optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const fileURLs =
        attachments.length > 0
          ? await Promise.all(
              attachments.map(async (file) => {
                const storageRef = ref(
                  storage,
                  `chat-attachments/${currentUser.uid}/${Date.now()}_${file.name}`
                );
                await uploadBytes(storageRef, file);
                return await getDownloadURL(storageRef);
              })
            )
          : [];

      await addDoc(collection(db, "inquiries"), {
        clientId,
        studentId: currentUser.uid,
        recipientId: activeConversation.recipientId,
        fixedStudentId: activeConversation.recipientId,
        fixedFacultyId: currentUser.uid,
        facultyEmail: currentUser.email,
        subject: activeConversation.subject,
        message: text,
        fileURLs,
        timestamp: serverTimestamp(),
        read: false,
      });

      setAttachments([]);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.clientId !== clientId));
      setNewMessage(text);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToConversations = () => {
    setShowConversationList(true);
    if (isMobile) {
      setActiveConversation(null);
    }
  };

  return (
    <Sidebar>
      <div className="flex h-screen bg-gray-50">
        {}
        <div
          className={`${
            isMobile ? "absolute inset-0 z-10" : "relative w-96"
          } bg-white border-r border-gray-200 flex flex-col ${
            isMobile && !showConversationList ? "hidden" : ""
          }`}
        >
          {}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh page"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MessageSquare className="w-12 h-12 mb-2" />
                <p className="text-center">No conversations found</p>
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Start New Conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={`${conversation.subject}-${conversation.recipientId}`}
                  conversation={conversation}
                  isActive={
                    activeConversation?.subject === conversation.subject &&
                    activeConversation?.recipientId === conversation.recipientId
                  }
                  onClick={() => handleConversationClick(conversation)}
                />
              ))
            )}
          </div>
        </div>

        {}
        <div
          className={`flex-1 flex flex-col ${
            isMobile && showConversationList ? "hidden" : ""
          }`}
        >
          {activeConversation ? (
            <>
              {}
              <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button
                        onClick={handleBackToConversations}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(activeConversation.studentInfo?.fullName || activeConversation.recipientInfo?.fullName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {activeConversation.studentInfo?.fullName || activeConversation.recipientInfo?.fullName || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {activeConversation.subject}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMobile && (
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Toggle details"
                      >
                        <Info className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.studentId === currentUser.uid}
                        activeConversation={activeConversation}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {}
              <div className="bg-white border-t border-gray-200 px-4 md:px-6 py-3 md:py-4">
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg"
                      >
                        <File className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-gray-500 hover:text-red-500"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="1"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={
                      (!newMessage.trim() && attachments.length === 0) || sendingMessage
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      !newMessage.trim() && attachments.length === 0
                        ? "bg-gray-200 text-gray-400"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    title="Send"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {isMobile ? "Select a conversation" : "Select a conversation"}
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a conversation from the list to start messaging
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowNewConversationModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Start New Conversation
                  </button>
                  {isMobile && (
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Conversations
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        {!isMobile && (
          <AnimatePresence>
            {showDetails && activeConversation && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white border-l border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Details</h3>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-3">
                        {getInitials(activeConversation.studentInfo?.fullName || activeConversation.recipientInfo?.fullName)}
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {activeConversation.studentInfo?.fullName || activeConversation.recipientInfo?.fullName || "Unknown User"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {activeConversation.studentInfo?.email || activeConversation.recipientInfo?.email}
                      </p>
                    </div>

                    {(activeConversation.studentInfo || activeConversation.recipientInfo) && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-700 mb-2">
                          {activeConversation.studentInfo?.type === "student" ? "Academic Info" : "User Info"}
                        </h5>
                        <div className="space-y-2">
                          {activeConversation.studentInfo?.educationLevel && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Education Level</span>
                              <span className="text-gray-900">
                                {activeConversation.studentInfo.educationLevel}
                              </span>
                            </div>
                          )}
                          {activeConversation.studentInfo?.gradeLevel && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Grade</span>
                              <span className="text-gray-900">
                                Grade {activeConversation.studentInfo.gradeLevel}
                              </span>
                            </div>
                          )}
                          {activeConversation.studentInfo?.section && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Section</span>
                              <span className="text-gray-900">
                                {activeConversation.studentInfo.section}
                              </span>
                            </div>
                          )}
                          {activeConversation.recipientInfo?.role && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Role</span>
                              <span className="text-gray-900">
                                {activeConversation.recipientInfo.role}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        Conversation Info
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Messages</span>
                          <span className="text-gray-900">{messages.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Started</span>
                          <span className="text-gray-900">
                            {messages[0] &&
                              moment(messages[0].timestamp).format("MMM DD, YYYY")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onStartConversation={handleStartNewConversation}
        currentUser={currentUser}
      />
    </Sidebar>
  );
}

export default ViewMessages;