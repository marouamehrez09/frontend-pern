// src/layouts/authentication/logout/Logout.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("userInfo");

    navigate("/authentication/sign-in");
  }, [navigate]);

  return null;
}

export default Logout;
