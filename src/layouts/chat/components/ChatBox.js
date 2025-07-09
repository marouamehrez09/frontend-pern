import React, { useState, useEffect, useRef } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../utils/firebase";
import PropTypes from "prop-types";
import moment from "moment";

import { Box, Typography, TextField, Button, Paper, Avatar } from "@mui/material";

function ChatBox({ user }) {
  const currentUserData = JSON.parse(sessionStorage.getItem("userInfo"));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const messagesRef = collection(db, "messages");
  const chatId = currentUserData && user ? [currentUserData.id, user.id].sort().join("_") : null;

  // Scroll automatique vers le bas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Écoute des messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(messagesRef, where("chatId", "==", chatId), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Marquer comme lus
      msgs.forEach(async (msg) => {
        if (msg.userId !== currentUserData.id && !msg.read) {
          await updateDoc(doc(db, "messages", msg.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      userId: currentUserData.id,
      userName: currentUserData.name,
      chatId,
      read: false,
      receiverId: user.id,
    });

    setNewMessage("");
  };

  if (!user) {
    return (
      <Box p={3}>
        <Typography color="text.secondary" textAlign="center">
          Veuillez sélectionner un utilisateur.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fdfdfd",
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 4,
          py: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
          bgcolor: "#fafafa",
        }}
      >
        <Avatar sx={{ mr: 2 }} src={user.avatarUrl || ""} />
        <Typography variant="h6">
          Conversation avec <span style={{ color: "#D81B60" }}>{user.name}</span>
        </Typography>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          px: 4,
          py: 3,
          overflowY: "auto",
          bgcolor: "#f9fafb",
        }}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.userId === currentUserData.id;

          return (
            <Box
              key={msg.id}
              display="flex"
              justifyContent={isCurrentUser ? "flex-end" : "flex-start"}
              mb={1.5}
            >
              <Box
                sx={{
                  bgcolor: isCurrentUser ? "#1976d2" : "#e5e5ea",
                  color: isCurrentUser ? "white" : "black",
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  orderTopRightRadius: isCurrentUser ? 0 : 3,
                  borderTopLeftRadius: isCurrentUser ? 3 : 0,
                  maxWidth: "70%",
                  position: "relative",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {msg.userName}
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: "break-word", mt: 0.5 }}>
                  {msg.text}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.6 }}>
                  {msg.createdAt ? moment(msg.createdAt.toDate()).calendar() : "Envoi..."}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          alignItems: "center",
          borderTop: "1px solid #ccc",
          px: 4,
          py: 2,
          borderTop: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <TextField
          fullWidth
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
          variant="outlined"
          sx={{
            backgroundColor: "#f0f2f5",
            borderRadius: "20px",
            mr: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#1976d2",
            px: 3,
            py: 1,
            borderRadius: "20px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
          }}
        >
          Envoyer
        </Button>
      </Box>
    </Paper>
  );
}

ChatBox.propTypes = {
  user: PropTypes.object.isRequired,
};

export default ChatBox;
