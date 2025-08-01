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
  Select,
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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "utils/firebase";

function Demande() {
  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token");

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Modales employé
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  // Commentaire RH
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [currentComment, setCurrentComment] = useState("");

  // Modal refus admin
  const [modalOpen, setModalOpen] = useState(false);
  const [commentaireRH, setCommentaireRH] = useState("");

  const showNotif = (msg, severity = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Ajout pour voir plus
  const [openFullText, setOpenFullText] = useState(false);
  const [fullTextTitle, setFullTextTitle] = useState("");
  const [fullTextDescription, setFullTextDescription] = useState("");

  const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const handleViewFullText = (title, description) => {
    setFullTextTitle(title);
    setFullTextDescription(description);
    setOpenFullText(true);
  };

  //  Fetch suggestions
  const fetchDemandes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/demande`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (role === "admin") {
        // Colonnes admin
        setColumns([
          { Header: "Titre", accessor: "title" },
          { Header: "Description", accessor: "description" },
          { Header: "Employé", accessor: "employe" },
          { Header: "Statut", accessor: "status", align: "center" },
          { Header: "Commentaire RH", accessor: "commentaireRH", align: "left" },
        ]);

        const rowData = res.data.map((s) => ({
          title: (
            <>
              {truncateText(s.title)}{" "}
              {s.title.length > 50 && (
                <Button size="small" onClick={() => handleViewFullText(s.title, s.description)}>
                  Voir
                </Button>
              )}
            </>
          ),
          description: (
            <>
              {truncateText(s.description)}{" "}
              {s.description.length > 50 && (
                <Button size="small" onClick={() => handleViewFullText(s.title, s.description)}>
                  Voir
                </Button>
              )}
            </>
          ),
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
                height: 36,
                width: 280,
                textAlign: "center",
                "& .MuiSelect-select": {
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
      } else {
        // Colonnes employé
        setColumns([
          { Header: "Titre", accessor: "title" },
          { Header: "Description", accessor: "description" },
          { Header: "Statut", accessor: "status" },
          { Header: "Commentaire RH", accessor: "commentaire_rh" },
          { Header: "Actions", accessor: "actions", align: "center" },
        ]);

        const rowData = res.data.map((s) => ({
          id: s.id,
          title: (
            <>
              {truncateText(s.title)}{" "}
              {s.title.length > 50 && (
                <Button size="small" onClick={() => handleViewFullText(s.title, s.description)}>
                  Voir
                </Button>
              )}
            </>
          ),
          description: (
            <>
              {truncateText(s.description)}{" "}
              {s.description.length > 50 && (
                <Button size="small" onClick={() => handleViewFullText(s.title, s.description)}>
                  Voir
                </Button>
              )}
            </>
          ),
          status: renderStatusBadge(s.status),
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
              {s.status === "en attente" && (
                <>
                  <Button
                    size="small"
                    onClick={() => handleEdit(s)}
                    color="success"
                    startIcon={<EditIcon />}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleDeleteConfirm(s.id)}
                    color="error"
                    startIcon={<DeleteIcon />}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </>
          ),
        }));
        setRows(rowData);
      }
    } catch (err) {
      showNotif("Erreur lors du chargement des demandes", "error");
    }
  };

  //  Badge status employé
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
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {status}
      </span>
    );
  };

  //  Admin : changement statut
  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "rejetée") {
      setSelectedDemandeId(id);
      setModalOpen(true);
    } else {
      updateDemandeStatus(id, newStatus);
    }
  };

  const updateDemandeStatus = async (id, status, commentaire = "") => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/demande/status/${id}`,
        { status, commentaire_rh: commentaire },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotif("Statut mis à jour");
      fetchDemandes();
    } catch {
      showNotif("Erreur lors de la mise à jour", "error");
    }
  };

  //  Employé CRUD
  const handleAddSubmit = async () => {
    if (!form.title || !form.description) {
      showNotif("Veuillez remplir tous les champs", "error");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/demande`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ajout notification Firestore
      await addDoc(collection(db, "notifications"), {
        receiverRole: "admin",
        message: `Nouvelle demande`,
        read: false,
        type: "demande",
        createdAt: serverTimestamp(),
      });
      showNotif("Demande ajoutée");
      setOpenAdd(false);
      setForm({ title: "", description: "" });
      fetchDemandes();
    } catch {
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
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/demande/${selectedDemandeId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("Demande modifiée");
      setOpenEdit(false);
      setForm({ title: "", description: "" });
      fetchDemandes();
    } catch {
      showNotif("Erreur lors de la modification", "error");
    }
  };

  const handleDeleteConfirm = (id) => {
    setSelectedDemandeId(id);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/demande/${selectedDemandeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotif("Demande supprimée");
      setOpenDelete(false);
      fetchDemandes();
    } catch {
      showNotif("Erreur lors de la suppression", "error");
    }
  };

  useEffect(() => {
    fetchDemandes();
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
                  {role === "admin" ? "Demandes des employés" : "Mes demandes"}
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

      {/* Modale ajout */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth>
        <DialogTitle>Ajouter une demande</DialogTitle>
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

      {/* Modale édition */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Modifier la demande</DialogTitle>
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

      {/* Confirmation suppression */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <MDTypography>Voulez-vous vraiment supprimer cette demande ?</MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Commentaire RH */}
      <Dialog open={openCommentModal} onClose={() => setOpenCommentModal(false)} fullWidth>
        <DialogTitle>Commentaire RH</DialogTitle>
        <DialogContent>
          <Typography>{currentComment}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentModal(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Modal refus admin */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Motif de refus</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Commentaire RH"
            value={commentaireRH}
            onChange={(e) => setCommentaireRH(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={() => {
              updateDemandeStatus(selectedDemandeId, "rejetée", commentaireRH);
              setModalOpen(false);
              setCommentaireRH("");
            }}
            color="error"
          >
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
        <MuiAlert elevation={6} variant="filled" severity={snackbarSeverity}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>

      {/* Popup contenu complet */}
      <Dialog open={openFullText} onClose={() => setOpenFullText(false)} fullWidth>
        <DialogTitle>{fullTextTitle}</DialogTitle>
        <DialogContent>
          <Typography>{fullTextDescription}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFullText(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Demande;
