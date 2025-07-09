/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import { useEffect, useState } from "react";
import axios from "axios";

// Overview page components
import Header from "layouts/profile/components/Header";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";

function Overview() {
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Profil récupéré :", res.data);

        setUser({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        });
      } catch (error) {
        console.error("Erreur lors du chargement du profil :", error);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL}/user/${user.id}`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Ferme la modale et recharge la liste
      showNotification("Employé modifié avec succès !");
      setEditModalOpen(false);
    } catch (err) {
      console.error("Erreur modification :", err);
    }
  };

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header name={user.name} role={user.role}>
        <MDBox display="flex" justifyContent="flex-end" pr={3} mt={2}>
          <Button variant="contained" color="primary" onClick={handleEdit} sx={{ color: "#fff" }}>
            Modifier
          </Button>
        </MDBox>
        <MDBox mt={5} mb={3}>
          <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
            <Divider orientation="vertical" sx={{ ml: -2, mr: 1 }} />
            <ProfileInfoCard
              title="Informations du profil"
              info={{
                name: user.name,
                email: user.email,
                //role: user.role,
              }}
              action={{}}
              shadow={false}
            />

            <Divider orientation="vertical" sx={{ mx: 0 }} />
          </Grid>
        </MDBox>
      </Header>

      {/* Modal edit */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth>
        <DialogTitle>Modifier employé</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            fullWidth
            margin="dense"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdate}>Modifier</Button>
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

export default Overview;
