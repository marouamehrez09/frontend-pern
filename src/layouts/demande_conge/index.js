import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MuiAlert from "@mui/material/Alert";

const typesConge = [
  "annuel",
  "maladie",
  "maternité",
  "paternité",
  "événements familiaux",
  "sans solde",
  "formation professionnelle",
  "convenance personnelle",
  "exceptionnel",
];

const role = sessionStorage.getItem("role");

const renderStatutBadge = (statut) => {
  let bgColor, icon;

  switch (statut) {
    case "accepté":
      bgColor = "#4caf50";
      break;
    case "refusé":
      bgColor = "#f44336";
      break;
    case "en attente":
      bgColor = "#ff9800";
      icon = "⏳";
      break;
    default:
      bgColor = "gray";
      icon = "❔";
  }

  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: "#fff",
        fontWeight: "bold",
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "0.85rem",
        display: "inline-block",
        textTransform: "capitalize",
        width: "120px",
        minWidth: "120px",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {icon} {statut}
    </span>
  );
};

function DemandeConges() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [congeForm, setCongeForm] = useState({
    date_debut: "",
    date_fin: "",
    type: "",
    motif: "",
  });

  const [currentCongeId, setCurrentCongeId] = useState(null);

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [congeToDelete, setCongeToDelete] = useState(null);

  const [openRefusDialog, setOpenRefusDialog] = useState(false);
  const [refusMotif, setRefusMotif] = useState("");

  const [selectedCongeId, setSelectedCongeId] = useState(null);
  const [selectedStatut, setSelectedStatut] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const fetchConges = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/conge`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const cols = [
        { Header: "Employé", accessor: "employee" },
        { Header: "Date début", accessor: "date_debut" },
        { Header: "Date fin", accessor: "date_fin" },
        { Header: "Type", accessor: "type" },
        { Header: "Motif", accessor: "motif" },
        { Header: "Statut", accessor: "statut" },
        { Header: "Commentaire", accessor: "commentaire_rh" },
        { Header: "Actions", accessor: "actions", align: "center" },
      ];

      const rows = res.data.map((c) => ({
        id: c.id,
        employee: `${c.employe?.name}`,
        date_debut: c.date_debut,
        date_fin: c.date_fin,
        type: c.type,
        motif: c.motif,
        statut:
          role === "admin" ? (
            <TextField
              select
              size="small"
              value={selectedStatut && selectedCongeId === c.id ? selectedStatut : c.statut}
              onChange={(e) => {
                const newStatut = e.target.value;
                if (newStatut !== c.statut) {
                  handleChangeStatut(c.id, newStatut);
                }
              }}
              sx={{
                backgroundColor:
                  c.statut === "accepté"
                    ? "#4caf50"
                    : c.statut === "refusé"
                    ? "#f44336"
                    : "#ff9800",
                color: "#fff",
                fontWeight: "bold",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                textTransform: "capitalize",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                width: "120px",
                minWidth: "120px",
                textAlign: "center",
                "& .MuiSelect-select": {
                  paddingLeft: 1,
                  paddingRight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
              }}
            >
              {["accepté", "refusé", "en attente"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            renderStatutBadge(c.statut)
          ),
        commentaire_rh:
          c.statut === "refusé" && c.commentaire_rh
            ? c.commentaire_rh
            : c.statut === "refusé"
            ? "Aucun commentaire"
            : "-",

        actions: (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {/* Bouton Modifier : visible uniquement pour employé ET si statut en attente */}
            {role !== "admin" && c.statut === "en attente" && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEdit(c)}
              >
                Modifier
              </Button>
            )}

            {/* Bouton Supprimer : visible si employé + en attente OU si admin */}
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setCongeToDelete(c.id);
                setOpenDeleteConfirm(true);
              }}
              disabled={c.statut !== "en attente"}
            >
              Supprimer
            </Button>
          </div>
        ),
      }));

      setColumns(cols);
      setRows(rows);
    } catch (err) {
      console.error("Erreur récupération des congés :", err);
    }
  };

  const handleChangeStatut = (id, newStatut) => {
    if (newStatut === "refusé") {
      setSelectedCongeId(id);
      setSelectedStatut(newStatut);
      setOpenRefusDialog(true);
    } else {
      updateStatut(id, newStatut);
    }
  };

  const handleAddSubmit = async () => {
    const token = sessionStorage.getItem("token");

    // ✅ 1. Vérifier que les champs sont remplis
    if (!congeForm.date_debut || !congeForm.date_fin || !congeForm.type || !congeForm.motif) {
      showNotification("Tous les champs sont obligatoires.");
      return;
    }

    // ✅ 2. Vérifier que la date de début est antérieure à la date de fin
    const start = new Date(congeForm.date_debut);
    const end = new Date(congeForm.date_fin);

    if (start.getTime() >= end.getTime()) {
      showNotification(
        "La date de fin doit être strictement supérieure à la date de début.",
        "error"
      );
      return;
    }

    // ✅ 3. Vérification pour congé maternité ou paternité
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (
      (congeForm.type === "maternité" || congeForm.type === "paternité") &&
      start < todayDateOnly
    ) {
      showNotification("Le congé maternité/paternité doit commencer aujourd'hui ou plus tard.");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/conge`, congeForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification("Demande envoyée avec succès !", "success");
      setOpenAdd(false);
      setCongeForm({ date_debut: "", date_fin: "", type: "", motif: "" });
      fetchConges();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        showNotification("Erreur : " + err.response.data.message);
      } else {
        showNotification("Une erreur est survenue lors de l'envoi de la demande.");
      }
    }
  };

  const showNotification = (message, severity = "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleEdit = (c) => {
    setCurrentCongeId(c.id);
    setCongeForm({
      date_debut: c.date_debut,
      date_fin: c.date_fin,
      type: c.type,
      motif: c.motif,
      document: null,
    });
    setOpenEdit(true);
  };

  const handleUpdateSubmit = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/conge/${currentCongeId}`, congeForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenEdit(false);
      fetchConges();
    } catch (err) {
      console.error("Erreur modification :", err);
    }
  };

  // Suppression avec confirmation
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/conge/${congeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenDeleteConfirm(false);
      setCongeToDelete(null);
      fetchConges();
    } catch (err) {
      console.error("Erreur suppression :", err);
    }
  };

  const updateStatut = async (id, statut, commentaire_rh = "") => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/conge/statut/${id}`,
        { statut, commentaire_rh },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedStatut("");
      fetchConges();
    } catch (err) {
      console.error("Erreur modification statut :", err);
    }
  };

  useEffect(() => {
    fetchConges();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
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
                  Gestion des congés
                </MDTypography>
                {role !== "admin" && (
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ float: "right", mb: 2 }}
                    onClick={() => {
                      setCongeForm({ date_debut: "", date_fin: "", type: "", motif: "" });
                      setOpenAdd(true);
                    }}
                  >
                    Ajouter
                  </Button>
                )}
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
      </MDBox>

      {/* Modale Ajouter */}
      {role !== "admin" && (
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth>
          <DialogTitle>Ajouter une demande</DialogTitle>
          <DialogContent>
            <TextField
              label="Date début"
              type="date"
              name="date_debut"
              value={congeForm.date_debut}
              onChange={(e) => setCongeForm({ ...congeForm, date_debut: e.target.value })}
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split("T")[0], // ⛔️ empêche de choisir une date passée
              }}
            />
            <TextField
              label="Date fin"
              type="date"
              name="date_fin"
              value={congeForm.date_fin}
              onChange={(e) => setCongeForm({ ...congeForm, date_fin: e.target.value })}
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split("T")[0], // ⛔️ empêche de choisir une date passée
              }}
            />
            <TextField
              select
              label="Type de congé"
              value={congeForm.type}
              onChange={(e) => setCongeForm({ ...congeForm, type: e.target.value })}
              fullWidth
              margin="dense"
              InputProps={{
                sx: {
                  height: 45,
                },
              }}
            >
              {typesConge.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Motif"
              multiline
              rows={3}
              value={congeForm.motif}
              onChange={(e) => setCongeForm({ ...congeForm, motif: e.target.value })}
              fullWidth
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Annuler</Button>
            <Button onClick={handleAddSubmit}>Ajouter</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Modale Modifier */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Modifier la demande</DialogTitle>
        <DialogContent>
          <TextField
            label="Date début"
            type="date"
            value={congeForm.date_debut}
            onChange={(e) => setCongeForm({ ...congeForm, date_debut: e.target.value })}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: new Date().toISOString().split("T")[0], //  empêche de choisir une date passée
            }}
          />
          <TextField
            label="Date fin"
            type="date"
            value={congeForm.date_fin}
            onChange={(e) => setCongeForm({ ...congeForm, date_fin: e.target.value })}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: new Date().toISOString().split("T")[0], //  empêche de choisir une date passée
            }}
          />
          <TextField
            select
            label="Type"
            value={congeForm.type}
            onChange={(e) => setCongeForm({ ...congeForm, type: e.target.value })}
            fullWidth
            margin="dense"
          >
            {typesConge.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Motif"
            multiline
            rows={3}
            value={congeForm.motif}
            onChange={(e) => setCongeForm({ ...congeForm, motif: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            type="file"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: ".pdf,.doc,.docx" }}
            onChange={(e) => setCongeForm({ ...congeForm, document: e.target.files[0] })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
          <Button onClick={handleUpdateSubmit}>Modifier</Button>
        </DialogActions>
      </Dialog>

      {/* Modale Confirmation Suppression */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr(e) de vouloir supprimer cette demande de congé ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Annuler</Button>
          <Button color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openRefusDialog} onClose={() => setOpenRefusDialog(false)} fullWidth>
        <DialogTitle>Motif du refus</DialogTitle>
        <DialogContent>
          <TextField
            label="Commentaire RH"
            multiline
            rows={4}
            value={refusMotif}
            onChange={(e) => setRefusMotif(e.target.value)}
            fullWidth
            required
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenRefusDialog(false)}>Annuler</Button>
          <Button
            color="error"
            onClick={() => {
              updateStatut(selectedCongeId, "refusé", refusMotif);
              setOpenRefusDialog(false);
              setRefusMotif("");
            }}
          >
            Confirmer le refus
          </Button>
        </DialogActions>
      </Dialog>

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

export default DemandeConges;
