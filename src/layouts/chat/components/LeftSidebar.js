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
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user`, {
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
      //console.log("Snapshot size:", snapshot.size);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const senderId = data.userId;
        //console.log("Message reçu de :", senderId, "| data:", data);

        if (!counts[senderId]) {
          counts[senderId] = 0;
        }
        counts[senderId]++;
      });

      //console.log("Compte final des messages non lus:", counts);
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
      elevation={4}
      sx={{
        height: "100%",
        width: "100%",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      <Box sx={{ px: 2, py: 2, borderBottom: "1px solid #eee", backgroundColor: "#fafafa" }}>
        <Typography variant="h6" fontWeight={600}>
          👥 Membres de l’équipe
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher un membre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mt: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        {filteredUsers.map((user) => {
          const userId = user.id;
          //console.log("👤 USER OBJ:", user);

          return (
            <ListItem
              button
              key={userId}
              onClick={() => handleUserClick(user)}
              sx={{
                mb: 1,
                borderRadius: 2,
                px: 2,
                py: 1.2,
                transition: "0.2s",
                "&:hover": {
                  backgroundColor: "#f0f4ff",
                },
              }}
            >
              <ListItemAvatar>
                {unreadCounts[userId] > 0 ? (
                  <Badge
                    badgeContent={unreadCounts[userId]}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: 10,
                        minWidth: 18,
                        height: 18,
                        fontWeight: 600,
                      },
                    }}
                  >
                    <Avatar alt={user.name} src={user.avatarUrl || ""} />
                  </Badge>
                ) : (
                  <Avatar alt={user.name} src={user.avatarUrl || ""} />
                )}
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography fontWeight={500} sx={{ fontSize: "0.95rem" }}>
                    {user.name}
                  </Typography>
                }
              />
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
