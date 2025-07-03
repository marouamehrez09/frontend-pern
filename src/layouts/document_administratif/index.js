import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

function Documents() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [docToDeleteId, setDocToDeleteId] = useState(null);

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("https://backend-pern-lahw.onrender.com/api/document", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const documents = res.data;

      const cols = [
        { Header: "Employé", accessor: "employee" },
        { Header: "Titre", accessor: "title" },
        { Header: "Type", accessor: "type" },
        { Header: "Date", accessor: "createdAt" },
        { Header: "Actions", accessor: "actions", align: "center" },
      ];

      const rowData = documents.map((doc) => ({
        id: doc.id,
        employeeId: doc.employeeId,
        employee: `${doc.employe?.name}`,
        title: doc.title,
        type: doc.type,
        createdAt: new Date(doc.createdAt).toLocaleDateString("fr-FR"),
        actions: (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <IconButton
              color="success"
              onClick={() => handleDownload(doc.id)}
              aria-label="download"
              size="small"
            >
              <DownloadIcon />
            </IconButton>

            {role === "admin" && (
              <>
                <IconButton
                  color="error"
                  onClick={() => confirmDelete(doc.id)}
                  aria-label="delete"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>

                <IconButton
                  color="info"
                  onClick={() => openEditDialog(doc)}
                  aria-label="update"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </>
            )}
          </div>
        ),
      }));

      setColumns(cols);
      setRows(rowData);
    } catch (error) {
      console.error("Erreur lors du chargement des documents :", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("https://backend-pern-lahw.onrender.com/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (err) {
      console.error("Erreur chargement des employés :", err);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await axios.get(
        `https://backend-pern-lahw.onrender.com/api/document/download/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `document-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors du téléchargement :", err);
    }
  };

  const handleUpdateDocument = async () => {
    if (!title || !type) {
      return alert("Tous les champs sont obligatoires.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", type);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      await axios.put(
        `https://backend-pern-lahw.onrender.com/api/document/${editingDocId}`,
        {
          title,
          type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Document modifié avec succès !");
      setOpenEditModal(false);
      fetchDocuments();
      setEditingDocId(null);
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err.response?.data || err.message);
      showNotification("Erreur lors de la modification du document", "error");
    }
  };

  const handleAddDocument = async () => {
    if (!employeeId || !title || !type || !selectedFile) {
      return showNotification("Tous les champs sont obligatoires, y compris le fichier.");
    }

    const formData = new FormData();
    formData.append("employeeId", employeeId);
    formData.append("title", title);
    formData.append("type", type);
    formData.append("file", selectedFile);

    try {
      await axios.post("https://backend-pern-lahw.onrender.com/api/document/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showNotification("Document ajouté avec succès !");
      setOpen(false);
      fetchDocuments();
    } catch (err) {
      // Log brut pour développement
      console.error("Erreur complète :", err);

      // Log propre + détaillé
      const status = err.response?.status;
      const data = err.response?.data;

      console.error("Status HTTP :", status);
      console.error(
        "Données erreur (data) :",
        typeof data === "object" ? JSON.stringify(data, null, 2) : data
      );

      const errorMsg =
        (typeof data === "object" && data?.error) ||
        (typeof data === "object" && data?.message) ||
        err.message;

      showNotification(`Erreur serveur : ${errorMsg}`, "error");
    }
  };

  const openEditDialog = (doc) => {
    setEditingDocId(doc.id);
    setTitle(doc.title);
    setType(doc.type);
    setEmployeeId(doc.employeeId);
    setOpenEditModal(true);
  };

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const confirmDelete = (id) => {
    setDocToDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await axios.delete(`https://backend-pern-lahw.onrender.com/api/document/${docToDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Document supprimé avec succès !");
      fetchDocuments();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      showNotification("Erreur lors de la suppression du document", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setDocToDeleteId(null);
    }
  };

  useEffect(() => {
    fetchDocuments();
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
                  Liste des documents administratifs
                </MDTypography>
                {role === "admin" && (
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ float: "right", mb: 2 }}
                    onClick={() => {
                      setEmployeeId("");
                      setType("");
                      setTitle("");
                      setOpen(true);
                    }}
                  >
                    Ajouter
                  </Button>
                )}
              </MDBox>
              <MDBox pt={3} px={2}>
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

      {/* Dialog de création de document */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            select
            label="Employé"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            InputProps={{
              sx: {
                height: 45,
              },
            }}
            margin="normal"
            onClick={() => {
              setType("");
              setTitle("");
              setSelectedFile(null);
              fetchEmployees();
            }}
          >
            <MenuItem disabled>-- Sélectionner un employe --</MenuItem>
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Type de document"
            value={type}
            onChange={(e) => setType(e.target.value)}
            InputProps={{
              sx: {
                height: 45,
              },
            }}
            margin="normal"
          >
            <MenuItem disabled>-- Sélectionner un choix --</MenuItem>
            <MenuItem value="attestation_travail">Attestation de travail</MenuItem>
            <MenuItem value="certificat_presence">Certificat de présence</MenuItem>
            <MenuItem value="attestation_presence">Attestation de présence</MenuItem>
            <MenuItem value="contrat">Contrat de travail</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginTop: "16px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddDocument}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification de document */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Modifier le document</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Type de document"
            value={type}
            onChange={(e) => setType(e.target.value)}
            margin="normal"
          >
            <MenuItem disabled>-- Sélectionner un choix --</MenuItem>
            <MenuItem value="attestation travail">Attestation de travail</MenuItem>
            <MenuItem value="attestation presence">Attestation de présence</MenuItem>
            <MenuItem value="certificat">Certificat de présence</MenuItem>
            <MenuItem value="contrat">Contrat de travail</MenuItem>
          </TextField>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginTop: "16px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdateDocument}>
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression de document */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <MDTypography>Voulez-vous vraiment supprimer ce document ?</MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirmed} variant="contained" color="error">
            Supprimer
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

export default Documents;
