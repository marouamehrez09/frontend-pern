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

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";

// Material Dashboard 2 React example components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "utils/firebase";
import { Badge } from "@mui/material";
import { useNavigate } from "react-router-dom";

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const route = useLocation().pathname.split("/").slice(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const navigate = useNavigate();

  {
    /*useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("userInfo"));
    if (!currentUser?.id) return;

    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", currentUser.id),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnreadMessages(messages);
      setUnreadCount(messages.length);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("userInfo"));
    const role = sessionStorage.getItem("role");

    if (role !== "admin") return;

    const q = query(
      collection(db, "notifications"),
      where("receiverRole", "==", "admin"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnreadMessages(notifs);
      setUnreadCount(notifs.length);
    });

    return () => unsubscribe();
  }, []);*/
  }

  // *-useEffect qui fisionne les notif des message et demande conge
  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem("userInfo"));
    const role = sessionStorage.getItem("role");

    if (!currentUser?.id) return;

    const unsubMessages = onSnapshot(
      query(
        collection(db, "messages"),
        where("receiverId", "==", currentUser.id),
        where("read", "==", false)
      ),
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "message", // on ajoute le type ici
        }));

        // Si admin, combiner avec notifications
        if (role === "admin") {
          const unsubNotifs = onSnapshot(
            query(
              collection(db, "notifications"),
              where("receiverRole", "==", "admin"),
              where("read", "==", false)
            ),
            (notifSnap) => {
              const notifs = notifSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                type: "conge", // on ajoute aussi le type ici
              }));

              // ⚠️ fusionne messages + notifications
              const allNotifs = [...messages, ...notifs];
              setUnreadMessages(allNotifs);
              setUnreadCount(allNotifs.length);
            }
          );

          // Nettoyage pour notifications
          return () => unsubNotifs();
        } else {
          // Si pas admin, on ne garde que messages
          setUnreadMessages(messages);
          setUnreadCount(messages.length);
        }
      }
    );

    return () => unsubMessages();
  }, []);

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {unreadMessages.length > 0 ? (
        unreadMessages.map((notif) => (
          <NotificationItem
            key={notif.id}
            icon={<Icon>{notif.type === "message" ? "mail" : "event"}</Icon>}
            title={
              notif.type === "message"
                ? `De : ${notif.userName || "Inconnu"}`
                : "Nouvelle demande de congé"
            }
            date={notif.message}
            onClick={async () => {
              if (notif.type === "conge") {
                navigate("/demande_conge");
              } else {
                navigate("/chat", {
                  state: {
                    user: { id: notif.userId, name: notif.userName },
                  },
                });
              }

              handleCloseMenu();

              // Marquer comme lue
              if (notif.type === "conge") {
                await updateDoc(doc(db, "notifications", notif.id), {
                  read: true,
                });
              } else {
                await updateDoc(doc(db, "messages", notif.id), {
                  read: true,
                });
              }
            }}
          />
        ))
      ) : (
        <NotificationItem
          icon={<Icon>check_circle</Icon>}
          title="Aucune notification"
          date="Tous les messages ont été lus"
        />
      )}
    </Menu>
  );

  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            {/*<MDBox pr={1}>
              <MDInput label="Search here" />
            </MDBox>*/}
            <MDBox color={light ? "white" : "inherit"}>
              <Link to="/profile">
                <IconButton sx={navbarIconButton} size="small" disableRipple>
                  <Icon sx={iconsStyle}>account_circle</Icon>
                </IconButton>
              </Link>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                onClick={handleOpenMenu}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  invisible={unreadCount === 0}
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: 11,
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  <Icon sx={iconsStyle}>notifications</Icon>
                </Badge>
              </IconButton>

              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
