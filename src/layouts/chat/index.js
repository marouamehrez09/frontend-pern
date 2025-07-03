import React, { useState } from "react";
import LeftSidebar from "../chat/components/LeftSidebar";
import ChatBox from "../chat/components/ChatBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div style={{ display: "flex", height: "calc(100vh - 64px)", backgroundColor: "#f9fafb" }}>
        {/* Sidebar à gauche */}
        <div
          style={{
            width: "280px",
            borderRight: "1px solid #e0e0e0",
            height: "100%",
            overflowY: "auto",
            marginRight: "16px",
          }}
        >
          <LeftSidebar onUserSelect={handleUserSelect} />
        </div>

        {/* Zone de chat à droite */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedUser ? (
            <ChatBox user={selectedUser} />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#666",
              }}
            >
              Sélectionnez un utilisateur pour commencer à discuter.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Chat;
