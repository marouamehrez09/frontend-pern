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

  useEffect(() => {
    fetchStats();
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

      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
