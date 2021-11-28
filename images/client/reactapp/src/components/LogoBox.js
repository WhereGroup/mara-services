import React from "react";
import { Paper } from "@mui/material";

function LogoBox() {
  return (
    <Paper
      elevation={10}
      style={{
        borderRadius: "15px",
        backgroundColor: "rgba(255,255,255,0.7)",
        top: "10px",
        left: "385px",
        position: "absolute",
        zIndex: 100000,
      }}
    >
      <img style={{ width: "400px" }} src="/logos.png" alt="" />
    </Paper>
  );
}

export default LogoBox;
