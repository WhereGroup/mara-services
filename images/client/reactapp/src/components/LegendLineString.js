import React, { useContext, useMemo } from "react";
import { Paper } from "@mui/material";
import { AppContext } from "./AppContext";

function LegendLineString() {
  const appContext = useContext(AppContext);

  const headline = "Public transport connections";

  const legendRows = useMemo(() => {
    let legendRows = [];

    appContext.mobilityLineColor.forEach((el, idx) => {
      if (typeof el === "number") {
        //console.log(appContext.mobilityLineColor[idx + 1]);
        let label = el;

        if(typeof appContext.mobilityLineColor[idx + 2] === 'undefined'){
          label = '≥' + label;
        }
        legendRows.push({
          color: appContext.mobilityLineColor[idx + 1],
          label: label,
        });
      }
    });

    return legendRows.reverse();
  }, [appContext.mobilityLineColor]);

  const widthLegend = useMemo(() => {
    let legendRows = [];

    let skipNext = false;
    appContext.mobilityLineWidth.forEach((el, idx) => {
      if (typeof el === "number") {
        if (skipNext) {
          skipNext = false;
          return;
        }
        skipNext = true;
        let label = el;

          if(legendRows.length === 0){
            label = '≤' + label;
        }else if(typeof appContext.mobilityLineWidth[idx + 2] === 'undefined'){ 
          label = '≥' + label;
        }

        legendRows.push({
          width: appContext.mobilityLineWidth[idx + 1],
          label: label,
        });
      }
    });

    return legendRows;
  }, [appContext.mobilityLineWidth]);

  return (
    <div className="legend_container">
      <Paper
        style={{
          position: "absolute",
          bottom: "10px",
          right: "160px",
          top: "initial",
          minHeight: "200px",
          width: "200px",
          backgroundColor: "rgba(255,255,255,0.7)",
          zIndex: "1000",
          margin: "10px",
          padding: "15px",
          borderRadius: "15px",
          fontSize: ".9rem",
        }}
        elevation={10}
      >
        <p
          style={{ marginTop: '0px' }}
        >Mobility</p>
        <div className="widthLegendContainer"
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
        >
          {widthLegend.map((el) => {
            return (
              <div
                className="widthLegendElement"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "40px",
                  marginRight:'1px'
                }}
            key={el.width}
              >
                <div className="widthLegendElement_indicator" style={{height:'30px'}}>
                  <div
                    className="widthLegendElement_indicatorStripe"
                    style={{ height: el.width + "px", backgroundColor: "#515151" }}
                  ></div>
                </div>
                <div className="widthLegendElement_label">{el.label}</div>
              </div>
            );
          })}
        </div>
        <p
          style={{ marginTop: '15px', marginBottom: '5px', }}
          dangerouslySetInnerHTML={{ __html: headline }}
        ></p>

        {legendRows.map((el, idx) => (
          <div
            className="legend_row"
            style={{ display: "flex", flexDirection: "row", padding: "2px" }}
            key={el.color}
          >
            <div
              className="legend_row-color"
              style={{
                background: (legendRows[idx+1] ? 'linear-gradient(' +  el.color + ', ' + legendRows[idx+1].color + ')':el.color),
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

export default LegendLineString;
