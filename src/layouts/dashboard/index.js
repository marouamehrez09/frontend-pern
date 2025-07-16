import React, { useEffect, useState } from "react";
import axios from "axios";

// MUI
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

// Material Dashboard 2 React
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    accepte: 0,
    refuse: 0,
  });

  const role = sessionStorage.getItem("role");

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null);
  const [commentaireRH, setCommentaireRH] = useState("");

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchStats = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/conge/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Erreur récupération statistiques :", err);
    }
  };

  const fetchSuggestions = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/suggestion`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setColumns([
        { Header: "Titre", accessor: "title" },
        { Header: "Description", accessor: "description" },
        { Header: "Employé", accessor: "employe" },
        { Header: "Statut", accessor: "status", align: "center" },
        { Header: "Commentaire RH", accessor: "commentaireRH", align: "left" },
      ]);

      const rowData = res.data.map((s) => ({
        title: s.title,
        description: s.description,
        employe: s.Employe?.name || "-",
        status: (
          <Select
            size="small"
            value={s.status}
            onChange={(e) => handleStatusChange(s.id, e.target.value)}
            disabled={["traitée", "rejetée"].includes(s.status.toLowerCase())}
            sx={{
              backgroundColor:
                s.status.toLowerCase() === "en attente"
                  ? "#2196f3"
                  : s.status.toLowerCase() === "validé et en cours de traitement"
                  ? "#ff9800"
                  : s.status.toLowerCase() === "traitée"
                  ? "#4caf50"
                  : s.status.toLowerCase() === "rejetée"
                  ? "#f44336"
                  : "#9e9e9e",

              borderRadius: "999px",
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "#fff",
              textTransform: "capitalize",
              height: 36,
              width: 280,
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",

              // Sélecteur interne pour forcer le style du texte visible
              "& .MuiSelect-select": {
                color: "#fff",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#fff", // Fond clair pour le menu
                  "& .MuiMenuItem-root": {
                    fontSize: "0.85rem",
                    textTransform: "capitalize",
                    color: "#333",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "#eee",
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="en attente">en attente</MenuItem>
            <MenuItem value="validé et en cours de traitement">
              validé et en cours de traitement
            </MenuItem>
            <MenuItem value="traitée">traitée</MenuItem>
            <MenuItem value="rejetée">rejetée</MenuItem>
          </Select>
        ),
        commentaireRH: (
          <div style={{ maxWidth: 300, whiteSpace: "pre-line" }}>{s.commentaire_rh || "-"}</div>
        ),
      }));

      setRows(rowData);
    } catch (error) {
      console.error(error);
      showNotification("Erreur chargement des suggestions", "error");
    }
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "rejetée") {
      setSelectedSuggestionId(id);
      setModalOpen(true); // attend la soumission du motif
    } else {
      updateSuggestionStatus(id, newStatus);
    }
  };

  const updateSuggestionStatus = async (id, status, commentaire = "") => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/suggestion/status/${id}`,
        { status, commentaire_rh: commentaire },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification("Statut mis à jour");
      fetchSuggestions();
    } catch (error) {
      console.error(error);
      showNotification("Erreur lors de la mise à jour", "error");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCommentaireRH("");
    setSelectedSuggestionId(null);
  };

  const handleModalSubmit = () => {
    if (!commentaireRH.trim()) {
      showNotification("Le motif est obligatoire pour un refus", "warning");
      return;
    }
    updateSuggestionStatus(selectedSuggestionId, "rejetée", commentaireRH);
    handleModalClose();
  };

  useEffect(() => {
    fetchStats();
    if (role === "admin") fetchSuggestions();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="info"
              icon="event"
              title="Total demandes"
              count={stats.total}
              percentage={{ label: "Toutes les demandes" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="warning"
              icon="hourglass_empty"
              title="En attente"
              count={stats.enAttente}
              percentage={{ label: "À traiter" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="success"
              icon="check_circle"
              title="Acceptés"
              count={stats.accepte}
              percentage={{ label: "Validés" }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="error"
              icon="cancel"
              title="Rejetés"
              count={stats.refuse}
              percentage={{ label: "Non approuvés" }}
            />
          </Grid>
        </Grid>
      </MDBox>

      {role === "admin" && (
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Suggestions des employés
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Modal de refus */}
      <Dialog open={modalOpen} onClose={handleModalClose}>
        <DialogTitle>Motif de refus</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Motif (commentaire RH)"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={commentaireRH}
            onChange={(e) => setCommentaireRH(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Annuler</Button>
          <Button variant="contained" onClick={handleModalSubmit} color="error">
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
