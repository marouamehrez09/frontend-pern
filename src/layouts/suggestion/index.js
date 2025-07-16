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
  Snackbar,
  Typography,
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
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const role = sessionStorage.getItem("role");

const renderStatusBadge = (status) => {
  let bgColor = "#9e9e9e";

  switch (status.toLowerCase()) {
    case "en attente":
      bgColor = "#2196f3";
      break;
    case "validé et en cours de traitement":
      bgColor = "#ff9800";
      break;
    case "traitée":
      bgColor = "#4caf50";
      break;
    case "rejetée":
      bgColor = "#f44336";
      break;
  }

  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: "#fff",
        fontWeight: 500,
        fontSize: "0.85rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        textTransform: "capitalize",
        width: "280px",
        height: "36px",
        textAlign: "center",
        userSelect: "none",
        gap: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
      title={status}
    >
      {status}
    </span>
  );
};

function Suggestion() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  // pour voir le commentaire RH
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [currentComment, setCurrentComment] = useState("");

  const fetchSuggestions = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/suggestion`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cols = [
        { Header: "Titre", accessor: "title" },
        { Header: "Description", accessor: "description" },
        { Header: "Statut", accessor: "status" },
        { Header: "Commentaire RH", accessor: "commentaire_rh" },
        { Header: "Actions", accessor: "actions", align: "center" },
      ];

      const rowData = res.data.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: renderStatusBadge(s.status),

        //  Affiche bouton "Voir" uniquement si commentaire existe
        commentaire_rh: s.commentaire_rh ? (
          <Button
            size="small"
            variant="contained"
            color="info"
            onClick={() => {
              setCurrentComment(s.commentaire_rh);
              setOpenCommentModal(true);
            }}
          >
            Voir
          </Button>
        ) : (
          "-"
        ),

        actions: (
          <>
            {role !== "admin" && s.status === "en attente" && (
              <Button
                size="small"
                onClick={() => handleEdit(s)}
                color="success"
                startIcon={<EditIcon />}
              >
                Modifier
              </Button>
            )}
            <Button
              size="small"
              onClick={() => handleDeleteConfirm(s.id)}
              color="error"
              startIcon={<DeleteIcon />}
            >
              Supprimer
            </Button>
          </>
        ),
      }));

      setColumns(cols);
      setRows(rowData);
    } catch (err) {
      console.error("Erreur de chargement :", err);
      showNotif("Erreur lors du chargement des suggestions", "error");
    }
  };

  const handleAddSubmit = async () => {
    if (!form.title || !form.description) {
      showNotif("Veuillez remplir tous les champs", "error");
      return;
    }
    const token = sessionStorage.getItem("token");
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/suggestion`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("Suggestion ajoutée avec succès");
      setOpenAdd(false);
      setForm({ title: "", description: "" });
      fetchSuggestions();
    } catch (err) {
      showNotif("Erreur lors de l'ajout", "error");
    }
  };

  const handleEdit = (s) => {
    setForm({ title: s.title, description: s.description });
    setSelectedSuggestionId(s.id);
    setOpenEdit(true);
  };

  const handleUpdateSubmit = async () => {
    if (!form.title || !form.description) {
      showNotif("Veuillez remplir tous les champs", "error");
      return;
    }
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/suggestion/${selectedSuggestionId}`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("Suggestion modifiée avec succès");
      setOpenEdit(false);
      setForm({ title: "", description: "" });
      fetchSuggestions();
    } catch (err) {
      showNotif("Erreur lors de la modification", "error");
    }
  };

  const handleDeleteConfirm = (id) => {
    setSelectedSuggestionId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/suggestion/${selectedSuggestionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotif("Suggestion supprimée avec succès");
      setOpenDelete(false);
      fetchSuggestions();
    } catch (err) {
      showNotif("Erreur lors de la suppression", "error");
    }
  };

  const showNotif = (msg, severity = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    fetchSuggestions();
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
                  Mes suggestions
                </MDTypography>
                {role !== "admin" && (
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ float: "right" }}
                    onClick={() => {
                      setForm({ title: "", description: "" });
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

      {/* Modale Ajout */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth>
        <DialogTitle>Ajouter une suggestion</DialogTitle>
        <DialogContent>
          <TextField
            label="Titre"
            fullWidth
            margin="dense"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Annuler</Button>
          <Button onClick={handleAddSubmit}>Ajouter</Button>
        </DialogActions>
      </Dialog>

      {/* Modale Edition */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Modifier la suggestion</DialogTitle>
        <DialogContent>
          <TextField
            label="Titre"
            fullWidth
            margin="dense"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
          <Button onClick={handleUpdateSubmit}>Modifier</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Suppression */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <MDTypography>Voulez-vous vraiment supprimer cette suggestion ?</MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modale pour voir le commentaire RH */}
      <Dialog open={openCommentModal} onClose={() => setOpenCommentModal(false)} fullWidth>
        <DialogTitle>Commentaire RH</DialogTitle>
        <DialogContent>
          <Typography>{currentComment}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentModal(false)}>Fermer</Button>
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

export default Suggestion;
