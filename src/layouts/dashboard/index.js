import React, { useEffect, useState } from "react";
import axios from "axios";

// @mui
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React
import MDBox from "components/MDBox";

// Layout et composants
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    accepte: 0,
    refuse: 0,
    parType: [],
  });

  const fetchStats = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8000/api/conge/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Stats reçues :", res.data);
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
              percentage={{
                color: "info",
                amount: "",
                label: "Toutes les demandes",
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="warning"
              icon="hourglass_empty"
              title="En attente"
              count={stats.enAttente}
              percentage={{
                color: "warning",
                amount: "",
                label: "À traiter",
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="success"
              icon="check_circle"
              title="Acceptés"
              count={stats.accepte}
              percentage={{
                color: "success",
                amount: "",
                label: "Validés",
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ComplexStatisticsCard
              color="error"
              icon="cancel"
              title="Refusés"
              count={stats.refuse}
              percentage={{
                color: "error",
                amount: "",
                label: "Non approuvés",
              }}
            />
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
