import React, { useState, useContext, useEffect, useRef } from "react";
import { AppContext } from "./AppContext";
import { MapLibreMap, MlLayer, MlGeoJsonLayer } from "@mapcomponents/react-maplibre";
import { MapContext } from "@mapcomponents/react-core";

import { Paper } from "@mui/material";
import Popper from "@mui/material/Popper";
//import MlGeoJsonLayer from "./MlGeoJsonLayer/MlGeoJsonLayer";
import Legend from "./Legend";
import LegendLineString from "./LegendLineString";

import Loader from "react-spinners/FadeLoader";
import LogoBox from "./LogoBox";
import Sidebar from "./Sidebar";
import ludwigslustParchim from "./assets/ludwigslust-parchim.json";

var hoveredRegionId = undefined;
var mapId = "map_1";
console.log(ludwigslustParchim)

const MaraApp = () => {
  const appContext = useContext(AppContext);
  const mapContext = useContext(MapContext);
  const mapRef = useRef(undefined);
  const hoveredMobilityIdRef = useRef("");
  const unwantedLayersHiddenRef = useRef(false);
  const [hoveredMobilityRecord, setHoveredMobilityRecord] = useState(undefined);
  const [hoveredRegion, setHoveredRegion] = useState(undefined);

  useEffect(() => {}, []);

  useEffect(() => {
    if (!mapContext.mapExists(mapId) || unwantedLayersHiddenRef.current) return;

    mapRef.current = mapContext.getMap(mapId);
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();

    let layersToHide = [
      "water-name-lakeline",
      "water-name-lakeline-en",
      //"water-name-ocean",
      "water-name-ocean-en",
      "water-name-other",
      "water-name-other-en",
      "poi-level-3",
      "poi-level-3-en",
      "poi-level-2",
      "poi-level-2-en",
      "poi-level-1",
      "poi-level-1-en",
      "highway-name-path",
      "highway-name-path-en",
      "highway-name-minor",
      "highway-name-minor-en",
      "highway-name-major",
      "highway-name-major-en",
      "highway-shield",
      "highway-shield-us-interstate",
      "highway-shield-us-other",
      "place-other",
      "place-other-en",
      "place-village",
      "place-village-en",
      //"place-town",
      "place-town-en",
      //"place-city",
      "place-city-en",
      "place-city-capital",
      "place-city-capital-en",
      "place-country-3",
      "place-country-3-en",
      "place-country-2",
      "place-country-2-en",
      "place-country-1",
      "place-country-1-en",
      "place-continent",
      "place-continent-en",
    ];
    layersToHide.forEach((layerId) =>
      mapRef.current.setLayoutProperty(layerId, "visibility", "none")
    );
  }, [mapContext.mapIds, mapContext]);

  return (
    <>
      <Sidebar />
      <LogoBox />
      <Legend />
      <LegendLineString />
      <MapLibreMap
        options={{
          zoom: 8,
          style:
            //"https://wms.wheregroup.com/tileserver/style/klokantech-basic.json",
            "https://wms.wheregroup.com/tileserver/style/osm-bright.json",
          //center: [8.607, 53.1409349],
          //          zoom: 13,
          center: [11.05721515315315, 53.48464201078592],
          //hash:true
        }}
        mapId={mapId}
      />
      {
        // Add marker layers to be able to dynamically add layers below any of them to keep the right layer order
        ["regionsMarker","ludwigslustParchimMarker", "mobilityMarker"].map((el) => (
          <MlLayer
            key={"positionMarkerLayer" + el}
            options={{
              id: el,
              type: "background",
              paint: {
                "background-color": "rgba(0,0,0,0)",
              },
            }}
            insertBeforeLayer="waterway-name"
            mapId={mapId}
          />
        ))
      }

        <MlGeoJsonLayer
        mapId={mapId}
        geojson={ludwigslustParchim}
        idSuffix="ludwigslustParchim"
        insertBeforeLayer="ludwigslustParchimMarker"
        type="line"
        paint={{
          "line-color": "#f09e17",
          "line-width": 5,
          //"line-opacity": .4,
          "line-blur": 1,
        }}
      />
      <MlGeoJsonLayer
        mapId={mapId}
        geojson={appContext.mobilityGeojson}
        idSuffix="mobility"
        insertBeforeLayer="mobilityMarker"
        type="line"
        paint={{
          "line-color": appContext.mobilityLineColor,
          "line-width": appContext.mobilityLineWidth,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.9,
          ],
        }}
        onLeave={function onLeaveMobility(e) {
          if (mapRef.current) {
            if (hoveredMobilityIdRef.current) {
              mapRef.current.setFeatureState(
                {
                  source: "MlGeoJsonLayer-mobility",
                  id: hoveredMobilityIdRef.current,
                },
                { hover: false }
              );
            }
            setHoveredMobilityRecord(undefined);
            hoveredMobilityIdRef.current = undefined;
          }
        }}
        onHover={function onHoverMobility(e) {
          if (mapRef.current) {
            if (hoveredMobilityIdRef.current) {
              mapRef.current.setFeatureState(
                {
                  source: "MlGeoJsonLayer-mobility",
                  id: hoveredMobilityIdRef.current,
                },
                { hover: false }
              );
            }
            if (e.features.length > 0) {
              hoveredMobilityIdRef.current = e.features[0].id;
              setHoveredMobilityRecord({
                rec: e.features[0],
                pos: { x: e.point.x, y: e.point.y },
              });

              mapRef.current.setFeatureState(
                { source: "MlGeoJsonLayer-mobility", id: e.features[0].id },
                { hover: true }
              );
            }
            if (typeof e.stopPropagation === "function") {
              e.stopPropagation();
            }
          }
        }}
      />
      <MlGeoJsonLayer
        mapId={mapId}
        geojson={appContext.regionsGeojson}
        idSuffix="regions"
        insertBeforeLayer="regionsMarker"
        paint={{
          "fill-color": appContext.regionFillColor,
          "fill-outline-color": "#838383",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.8,
          ],
        }}
        type="fill"
        onLeave={(e) => {
          if (mapRef.current) {
            if (hoveredRegionId) {
              mapRef.current.setFeatureState(
                { source: "MlGeoJsonLayer-regions", id: hoveredRegionId },
                { hover: false }
              );
            }
            mapRef.current.getCanvas().style.cursor = "";
            setHoveredRegion(undefined);
            hoveredRegionId = undefined;
          }
        }}
        onHover={(e) => {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "pointer";
            if (hoveredRegionId) {
              mapRef.current.setFeatureState(
                { source: "MlGeoJsonLayer-regions", id: hoveredRegionId },
                { hover: false }
              );
            }
            if (e.features.length > 0) {
              hoveredRegionId = e.features[0].id;
              setHoveredRegion({
                rec: e.features[0],
                pos: { x: e.point.x, y: e.point.y },
              });
              mapRef.current.setFeatureState(
                { source: "MlGeoJsonLayer-regions", id: hoveredRegionId },
                { hover: true }
              );
            }
          }
        }}
        onClick={(e) => {
          if (mapRef.current) {
            if (appContext.selectedRegionIdRef.current) {
              mapRef.current.setFeatureState(
                {
                  source: "MlGeoJsonLayer-regions",
                  id: appContext.selectedRegionIdRef.current,
                },
                { selected: false }
              );
            }
            if (e.features.length > 0) {
              appContext.setSelectedRegionId(e.features[0].properties.region);
              appContext.setSelectedRegion(e.features[0]);
              appContext.selectedRegionIdRef.current =
                e.features[0].properties.region;
              appContext.setMobilityGeojson({
                type: "FeatureCollection",
                features: [],
              });
              mapRef.current.setFeatureState(
                {
                  source: "MlGeoJsonLayer-regions",
                  id: appContext.selectedRegionIdRef.current,
                },
                { selected: true }
              );
            }
          }
        }}
      />
      {appContext.loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            zIndex: "1000",
            marginLeft: "-30px",
            marginTop: "-30px",
          }}
        >
          <Loader speedMultiplier={2} />
        </div>
      )}
      {!hoveredMobilityRecord && hoveredRegion && (
        <Popper
          id={"mobility_info_popup"}
          open={true}
          anchorEl={document.querySelector("body")}
          style={{
            zIndex: 100000,
            top: hoveredRegion.pos.y + 20 + "px",
            left: hoveredRegion.pos.x + "px",
          }}
          transition
          placement="bottom-start"
        >
          <Paper
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              marginTop: 0,
              marginBottom: 0,
              padding: "10px",
            }}
            elevation={10}
          >
            <p style={{ fontWeight: "bold", marginTop: 0, marginBottom: 0 }}>
              {hoveredRegion.rec.properties.region_label}
            </p>
          </Paper>
        </Popper>
      )}
      {hoveredMobilityRecord && (
        <Popper
          id={"mobility_info_popup"}
          open={true}
          anchorEl={document.querySelector("body")}
          style={{
            zIndex: 100000,
            top: hoveredMobilityRecord.pos.y + 20 + "px",
            left: hoveredMobilityRecord.pos.x + "px",
          }}
          transition
          placement="bottom-start"
        >
          <Paper
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              marginTop: 0,
              marginBottom: 0,
              padding: "10px",
            }}
            elevation={10}
          >
            <p style={{ fontWeight: "bold", marginTop: 0, marginBottom: "5px" }}>
              {hoveredMobilityRecord.rec.properties.region_origin_label} >{" "}
              {hoveredMobilityRecord.rec.properties.region_destination_label}
            </p>
            <table
              cellPadding="0"
              cellSpacing="0"
              border="0"
              style={{ fontSize: ".8rem" }}
            >
              <tbody>
                <tr>
                  <td>mobility</td>
                  <td style={{ fontWeight: "bold" }}>
                    {hoveredMobilityRecord.rec.properties.count_mobility}
                  </td>
                </tr>
                <tr>
                  <td>public transport&nbsp;&nbsp;</td>
                  <td style={{ fontWeight: "bold" }}>
                    {hoveredMobilityRecord.rec.properties.count_pt}
                  </td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </Popper>
      )}
    </>
  );
};

export default MaraApp;
