import React, { useContext } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import FormLabel from "@mui/material/FormLabel";
import Slider from "@mui/material/Slider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import Loader from "react-spinners/FadeLoader";

import { AppContext } from "./AppContext";
import { MapContext } from "@mapcomponents/react-core";

const drawerWidth = 240;


function Sidebar() {
  const appContext = useContext(AppContext);
  const mapContext = useContext(MapContext);

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        style={{}}
        PaperProps={{
          style: {
            height: "97%",
            maxHeight: "97%",
            margin: "10px",
            backgroundColor: "rgba(255,255,255,0.7)",
            width: "360px",
            borderRadius: "15px",
            padding: "30px",
          },
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        open={true}
        variant="temporary"
        anchor="left"
        hideBackdrop={true}
      >
        <Typography
          variant="h5"
          component="h1"
          style={{ fontSize: "1.2rem", marginBottom: "20px" }}
        >
          MARA PTM Tool
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          style={{ fontSize: "1.1rem", fontWeight: "bold" }}
        >
          Inter-municipal mobility flows
        </Typography>
        <Typography variant="caption" component="p" style={{ marginBottom: "20px" }}>
          choose an option and click on a region
        </Typography>
        <FormLabel component="legend">Region color</FormLabel>
        <RadioGroup
          row
          aria-label="region color"
          name="row-radio-buttons-group"
          value={appContext.regionColoring}
          onChange={(event) => {
            appContext.setRegionColoring(event.target.value);
          }}
        >
          <FormControlLabel value="mobility" control={<Radio />} label="mobility" />
          <FormControlLabel
            value="pt"
            control={<Radio />}
            label="public transport"
          />
        </RadioGroup>
        <FormControlLabel
          control={
            <Switch
              checked={appContext.showIncoming}
              onChange={appContext.showIncomingChangeHandler}
              name="gilad"
            />
          }
          label="Incoming"
        />
        <FormControlLabel
          control={
            <Switch
              checked={appContext.showOutgoing}
              onChange={appContext.showOutgoingChangeHandler}
              name="jason"
            />
          }
          label="Outgoing"
          style={{
            marginBottom: "15px",
          }}
        />
        <FormLabel component="legend" style={{ color: "rgba(0, 0, 0, 0.87)" }}>
          Temporal settings
        </FormLabel>
        <FormControlLabel
          control={
            <Switch
              checked={appContext.showDailyMobility}
              onChange={appContext.showDailyMobilityChangeHandler}
              name="daily"
            />
          }
          label="Daily"
        />
        <FormControlLabel
          control={
            <Switch
              disabled={!appContext.showDailyMobility}
              checked={appContext.showDailyMobilityAsInterval}
              onChange={appContext.showDailyMobilityAsIntervalChangeHandler}
              name="daily_interval"
            />
          }
          label="Daily interval"
        />
        <FormLabel style={{ marginBottom: "40px" }}>Day</FormLabel>
        <Slider
          style={{
            marginBottom: "30px",
          }}
          disabled={!appContext.showDailyMobility}
          aria-label="Days"
          getAriaValueText={(value) => value}
          sx={{
            "& .MuiSlider-valueLabel": {
              //
              //              width:          "32px",
              //              height:         "32px",
              //              display:        "flex",
              //              transform:      "rotate( -45deg)",
              //              alignItems:     "center",
              //              borderRadius:   "50% 50% 50% 0",
              //              justifyContent: "center",
              //              padding: 0,
              //              top:'-34px',
            },
            "& .MuiSlider-mark": {
              backgroundColor: "#1665b3",
              height: 3,
              width: 3,
              "&.MuiSlider-markActive": {
                opacity: 1,
                backgroundColor: "currentColor",
              },
            },
          }}
          getAriaLabel={() => "Days"}
          value={appContext.days}
          onChange={appContext.changeDaysHandler}
          valueLabelDisplay="on"
          min={1}
          max={7}
          step={1}
          track={false}
          marks={[
            {
              value: 1,
              label: "Mon",
            },
            {
              value: 2,
              label: "Tue",
            },
            {
              value: 3,
              label: "Wed",
            },
            {
              value: 4,
              label: "Th",
            },
            {
              value: 5,
              label: "Fri",
            },
            {
              value: 6,
              label: "Sat",
            },
            {
              value: 7,
              label: "Sun",
            },
          ]}
        />
        <FormControlLabel
          control={
            <Switch
              checked={appContext.showHourlyMobility}
              onChange={appContext.showHourlyMobilityChangeHandler}
              name="jason"
            />
          }
          label="Hourly"
        />
        <FormControlLabel
          control={
            <Switch
              disabled={!appContext.showHourlyMobility}
              checked={appContext.showHourlyMobilityAsInterval}
              onChange={appContext.showHourlyMobilityAsIntervalChangeHandler}
              name="jason"
            />
          }
          label="Hourly interval"
          style={{
            marginBottom: "20px",
          }}
        />
        <FormLabel style={{ marginBottom: "40px" }}>Hour</FormLabel>
        <Slider
          disabled={!appContext.showHourlyMobility}
          aria-label="Hours"
          getAriaValueText={(value) => value}
          sx={{
            "& .MuiSlider-mark": {
              backgroundColor: "#1665b3",
              height: 3,
              width: 3,
              "&.MuiSlider-markActive": {
                opacity: 1,
                backgroundColor: "currentColor",
              },
            },
          }}
          getAriaLabel={() => "Hours"}
          value={appContext.hours}
          onChange={appContext.changeHoursHandler}
          valueLabelDisplay="on"
          min={0}
          max={23}
          step={1}
          track={false}
          marks={true}
        />
        <Divider />
        {appContext.selectedRegion && (
          <>
            <Typography
              variant="p"
              component="div"
              style={{ marginTop: "20px", lineHeight: "30px", fontWeight: "bold" }}
            >
              Selected Region: {appContext.selectedRegion.properties.region_label}
              {appContext.mobilityDataLoading && (
                <div
                  style={{
                    display: "inline-block",
                    height: "15px",
                    width: "15px",
                    //marginTop: "15px",
                    marginLeft: "10px",
                    marginBottom: "-2px",
                    transform: "scale(.3)",
                  }}
                >
                  <Loader css={{ top: 0, left: 0 }} speedMultiplier={2} />
                </div>
              )}
            </Typography>
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{ marginTop: "10px", fontSize: ".8rem" }}
            >
              <tbody>
                <tr>
                  <td style={{ width: "100px" }}>mobility</td>
                  <td style={{ fontWeight: "bold" }}>
                    {appContext.selectedRegion.properties.count_mobility}
                  </td>
                </tr>
                <tr>
                  <td>public transport&nbsp;</td>
                  <td style={{ fontWeight: "bold" }}>
                    {appContext.selectedRegion.properties.count_pt}
                  </td>
                </tr>
              </tbody>
            </table>
            <Button
              size="small"
              variant="outlined"
              style={{ marginTop: "6px" }}
              onClick={appContext.exportMobilityAsCsv}
            >
              CSV export
            </Button>
            <Button
              size="small"
              variant="outlined"
              style={{ marginTop: "6px" }}
              onClick={() => {
                mapContext.map.setFeatureState(
                  {
                    source: "MlGeoJsonLayer-regions",
                    id: appContext.selectedRegionIdRef.current,
                  },
                  { selected: false }
                );
                appContext.setSelectedRegion(undefined);
                appContext.setSelectedRegionId(undefined);
                appContext.selectedRegionIdRef.current = undefined;
                appContext.setMobilityGeojson({
                  type: "FeatureCollection",
                  features: [],
                });
              }}
            >
              Reset selection
            </Button>
          </>
        )}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
