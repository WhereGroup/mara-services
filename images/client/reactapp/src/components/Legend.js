import React, { useContext, useMemo } from "react";
import { Paper } from "@mui/material";
import { AppContext } from "./AppContext";

function Legend() {
  const appContext = useContext(AppContext);

  const headline = useMemo(() => {
    //let headline = "Daily average number of people starting their trip. 0:00-23:59"
    let headline = "number of";

    if (appContext.regionColoring === "mobility") {
      headline += " people starting their trip.";
    } else {
      headline += " public transport connections.";
    }

    if (appContext.showHourlyMobility && appContext.showHourlyMobilityAsInterval) {
      headline = "hourly " + headline;
    } else if (
      !appContext.showDailyMobility ||
      appContext.showDailyMobilityAsInterval
    ) {
      headline = "daily " + headline;
    }

    if(!appContext.showHourlyMobility){
      headline += ' 0:00&nbsp;-&nbsp;23:59';
    }else if(appContext.showHourlyMobility && !appContext.showHourlyMobilityAsInterval) {
      headline += ' ' + appContext.hours + ':00&nbsp;-&nbsp;' + appContext.hours + ':59';
    }else if(appContext.showHourlyMobility && appContext.showHourlyMobilityAsInterval) {
      headline += ' ' + appContext.hours[0] + ':00&nbsp;-&nbsp;' + appContext.hours[1] + ':59';
    }

    return headline.charAt(0).toUpperCase() + headline.slice(1);
  }, [
    appContext.regionColoring,
    appContext.showDailyMobility,
    appContext.showDailyMobilityAsInterval,
    appContext.showHourlyMobility,
    appContext.showHourlyMobilityAsInterval,
    appContext.hours,
  ]);
  const legendRows = useMemo(() => {
    let legendRows = [];

    appContext.regionFillColor.forEach((el, idx) => {
      if (typeof el === "number") {
        //console.log(appContext.regionFillColor[idx + 1]);
        let label = Math.round(el);
        if (el === 0) {
          label = "no data";
        } else {
          if (typeof appContext.regionFillColor[idx + 2] === "number") {
            label += " - " + Math.round(appContext.regionFillColor[idx + 2] - 1);
          } else {
            label = "≥ " + label;
          }
        }

        legendRows.push({
          color: appContext.regionFillColor[idx + 1],
          label: label,
        });
      }
    });

    return legendRows.reverse();
  }, [appContext.regionFillColor]);

  return (
    <div className="legend_container">
      <Paper
        style={{
          position: "absolute",
          bottom: "10px",
          right: "0px",
          top: "initial",
          minHeight: "200px",
          width: "120px",
          backgroundColor: "rgba(255,255,255,0.7)",
          zIndex: "1000",
          margin: "10px",
          padding: "15px",
          borderRadius: "15px",
          fontSize: ".9rem",
        }}
        elevation={10}
      >
        <p style={{marginTop:0}} dangerouslySetInnerHTML={{__html:headline}}></p>

        {legendRows.map((el) => (
          <div
            className="legend_row"
            style={{ display: "flex", flexDirection: "row", padding: "2px" }}
            key={el.color}
          >
            <div
              className="legend_row-color"
              style={{
                backgroundColor: el.color,
                width: "18px",
                height: "18px",
                marginRight: "5px",
              }}
            ></div>
            <div className="legend_row-label">{el.label}</div>
          </div>
        ))}
      </Paper>
    </div>
  );
}

export default Legend;
