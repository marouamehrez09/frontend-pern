import React, { useEffect, useState } from "react";
import axios from "axios";

// MUI + Material Dashboard Components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MuiAlert from "@mui/material/Alert";

function Employees() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [currentEmployee, setCurrentEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    salaire: "",
    leaveBalance: "",
  });
  const [roleError, setRoleError] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const fetchEmployees = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8000/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const employees = res.data;

      // Adapter les colonnes
      const cols = [
        { Header: "Nom", accessor: "name" },
        { Header: "Email", accessor: "email" },
        { Header: "Rôle", accessor: "role" },
        { Header: "Salaire", accessor: "salaire" },
        { Header: "Solde Congés", accessor: "leaveBalance" },
        { Header: "Actions", accessor: "actions", align: "center" },
      ];

      // Adapter les données pour chaque ligne
      const rowData = employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        salaire: emp.salaire + " DT",
        leaveBalance: emp.leaveBalance + " jours",
        actions: (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => handleEdit(emp)}
            >
              Modifier
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteClick(emp.id)}
            >
              Supprimer
            </Button>
          </div>
        ),
      }));

      setColumns(cols);
      setRows(rowData);
    } catch (err) {
      console.error("Erreur lors de la récupération des employés :", err);
    }
  };

  const handleAdd = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.post("http://localhost:8000/api/user/register", currentEmployee, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification("Employe ajouté avec succès !");
      setAddModalOpen(false);
      setCurrentEmployee({
        name: "",
        email: "",
        password: "",
        role: "",
        salaire: "",
        leaveBalance: "",
      });
      fetchEmployees();
    } catch (err) {
      console.error("Erreur ajout :", err);
    }
  };

  const handleDeleteClick = (id) => {
    setEmployeeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    const token = sessionStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/user/${employeeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Employé supprimé avec succès !");
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      console.error("Erreur suppression :", err);
    }
  };

  const handleEdit = (emp) => {
    setCurrentEmployee({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      salaire: emp.salaire,
      leaveBalance: emp.leaveBalance,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(`http://localhost:8000/api/user/${currentEmployee.id}`, currentEmployee, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Ferme la modale et recharge la liste
      showNotification("Employé modifié avec succès !");
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error("Erreur modification :", err);
    }
  };

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    fetchEmployees();
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
                  Liste des employés
                </MDTypography>
                <Button
                  variant="contained"
                  color="success"
                  sx={{ float: "right", mb: 2 }}
                  onClick={() => {
                    setCurrentEmployee({
                      name: "",
                      email: "",
                      password: "",
                      role: "",
                      salaire: "",
                      leaveBalance: "",
                    });
                    setAddModalOpen(true);
                  }}
                >
                  Ajouter
                </Button>
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
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} fullWidth>
        <DialogTitle>Ajouter un employe</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            fullWidth
            margin="dense"
            value={currentEmployee.name}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={currentEmployee.email}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
          />
          <TextField
            label="Mot de passe"
            fullWidth
            margin="dense"
            type="password"
            value={currentEmployee.password}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, password: e.target.value })}
          />
          <TextField
            select
            label="Rôle"
            fullWidth
            margin="dense"
            variant="outlined"
            value={currentEmployee.role || ""}
            error={roleError}
            helperText={roleError ? "Veuillez sélectionner un rôle." : ""}
            onChange={(e) => {
              setCurrentEmployee({ ...currentEmployee, role: e.target.value });
              setRoleError(false);
            }}
            InputProps={{
              sx: {
                height: 45,
              },
            }}
          >
            <MenuItem value="" disabled>
              -- Sélectionnez un rôle --
            </MenuItem>
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="employe">employe</MenuItem>
          </TextField>

          <TextField
            label="Salaire"
            fullWidth
            margin="dense"
            value={currentEmployee.salaire}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, salaire: e.target.value })}
          />
          <TextField
            label="Solde Congés"
            fullWidth
            margin="dense"
            value={currentEmployee.leaveBalance}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, leaveBalance: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Annuler</Button>
          <Button onClick={handleAdd}>Ajouter</Button>
        </DialogActions>
      </Dialog>

      {/* Modale Modifier */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth>
        <DialogTitle>Modifier employé</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            fullWidth
            margin="dense"
            value={currentEmployee.name}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={currentEmployee.email}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
          />
          <TextField
            select
            label="Rôle"
            fullWidth
            margin="dense"
            value={currentEmployee.role || ""}
            error={roleError}
            helperText={roleError ? "Veuillez sélectionner un rôle." : ""}
            onChange={(e) => {
              setCurrentEmployee({ ...currentEmployee, role: e.target.value });
              setRoleError(false);
            }}
            InputProps={{
              sx: {
                height: 45,
              },
            }}
          >
            <MenuItem value="" disabled>
              -- Sélectionnez un rôle --
            </MenuItem>
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="employe">employe</MenuItem>
          </TextField>
          <TextField
            label="Salaire"
            fullWidth
            margin="dense"
            value={currentEmployee.salaire}
            onChange={(e) => setCurrentEmployee({ ...currentEmployee, salaire: e.target.value })}
          />
          <TextField
            label="Solde Congés"
            fullWidth
            margin="dense"
            value={currentEmployee.leaveBalance}
            onChange={(e) =>
              setCurrentEmployee({ ...currentEmployee, leaveBalance: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdate}>Modifier</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <MDTypography>Voulez-vous vraiment supprimer cet employe?</MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
          <Button color="error" onClick={confirmDelete}>
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

export default Employees;
