import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Typography,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Paper,
  Box,
} from "@mui/material";
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../utils/firebase";

const LeftSidebar = ({ onUserSelect }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const token = sessionStorage.getItem("token");
  const currentUser = JSON.parse(sessionStorage.getItem("userInfo"));

  // 🟢 Récupération des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
      }
    };

    if (token) fetchUsers();
  }, [token]);

  // 🟢 Mise à jour des comptes de messages non lus
  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", currentUser.id),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const senderId = data.userId;

        if (!counts[senderId]) {
          counts[senderId] = 0;
        }
        counts[senderId]++;
      });

      setUnreadCounts(counts);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // 🟢 Lorsqu'on sélectionne un utilisateur, marquer ses messages comme lus
  const handleUserClick = async (user) => {
    const chatId = [currentUser.id, user._id].sort().join("_");

    // Récupère les messages non lus de cet utilisateur
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      where("receiverId", "==", currentUser.id),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    snapshot.forEach(async (msgDoc) => {
      await updateDoc(doc(db, "messages", msgDoc.id), {
        read: true,
      });
    });

    // Appeler le parent pour ouvrir la conversation
    onUserSelect(user);
  };

  // 🟢 Filtrage de la liste selon la recherche
  const filteredUsers = users
    .filter((u) => u._id !== currentUser?.id)
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        p: 2,
        borderRight: "1px solid #e0e0e0",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Membres de l’équipe
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <List>
        {filteredUsers.map((user) => {
          const userId = user._id; // 🔁 doit être le même que dans Firestore
          return (
            <ListItem
              button
              key={userId}
              onClick={() => handleUserClick(user)}
              sx={{
                borderRadius: 2,
                mb: 1,
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={unreadCounts[userId] || 0}
                  color="error"
                  invisible={!unreadCounts[userId]}
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: 11,
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  <Avatar alt={user.name} src={user.avatarUrl || ""} />
                </Badge>
              </ListItemAvatar>

              <ListItemText primary={<Typography fontWeight={500}>{user.name}</Typography>} />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

LeftSidebar.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
};

export default LeftSidebar;
