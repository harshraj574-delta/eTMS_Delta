import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  Polyline,
  Marker,
  Popup,
  LayerGroup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import polylineUtil from "@mapbox/polyline";
import { MultiSelect } from 'primereact/multiselect';
import "leaflet/dist/leaflet.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import ManageRouteService from "../services/compliance/ManageRouteService";
import Loader from "./common/Loader";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';


function MapLibreLayer({ onTilesLoaded }) {
  const map = useMap();
  const layerRef = useRef(null);
  const glMapRef = useRef(null);
  const tilesLoadedRef = useRef(false);
  const onTilesLoadedRef = useRef(onTilesLoaded);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    onTilesLoadedRef.current = onTilesLoaded;
  }, [onTilesLoaded]);

  useEffect(() => {
    if (layerRef.current) return;
    if (!map) return;

    if (!window.maplibregl) {
      window.maplibregl = maplibregl;
    }

    try {
      const maplibreLayer = L.maplibreGL({
        style: 'https://tiles.openfreemap.org/styles/liberty',
        interactive: false,
        maplibreOptions: {
          maxTileCacheSize: 300,
          fadeDuration: 300,
          crossSourceCollisions: false,
          optimizeForTerrain: false,
          refreshExpiredTiles: false,
          preserveDrawingBuffer: true,
          trackResize: true,
          antialias: true,
        }
      });

      maplibreLayer.addTo(map);
      layerRef.current = maplibreLayer;

      // Force tiles loaded after 3 seconds as a safety net
      const safetyTimeout = setTimeout(() => {
        if (!tilesLoadedRef.current) {
          console.warn('MapLibre layer load timed out - forcing ready state');
          tilesLoadedRef.current = true;
          if (onTilesLoadedRef.current) {
            onTilesLoadedRef.current();
          }
        }
      }, 3000);

      const checkMapReady = () => {
        if (maplibreLayer.getMaplibreMap) {
          const glMap = maplibreLayer.getMaplibreMap();
          
          if (glMap) {
            glMapRef.current = glMap;
            
            // If map is already loaded, trigger callback
            if (glMap.loaded()) {
               if (!tilesLoadedRef.current) {
                  tilesLoadedRef.current = true;
                  if (onTilesLoadedRef.current) {
                    onTilesLoadedRef.current();
                  }
               }
            }

            glMap.on('load', () => {
               // Map loaded
            });

            glMap.on('idle', () => {
              if (!tilesLoadedRef.current) {
                tilesLoadedRef.current = true;
                if (onTilesLoadedRef.current) {
                  onTilesLoadedRef.current();
                }
              }
            });

            // Clear the interval once we found the map
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }
      };

      // Check immediately and then periodically
      checkMapReady();
      checkIntervalRef.current = setInterval(checkMapReady, 100);

      return () => {
        clearTimeout(safetyTimeout);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        
        if (glMapRef.current) {
          glMapRef.current = null;
        }
        if (layerRef.current && map) {
            try {
               map.removeLayer(layerRef.current);
            } catch (e) {
               // ignore
            }
            layerRef.current = null;
        }
      };

    } catch (err) {
      console.error('Failed to initialize MapLibre GL layer:', err);
      const fallbackLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap' }
      );
      fallbackLayer.addTo(map);
      layerRef.current = fallbackLayer;

      if (onTilesLoadedRef.current && !tilesLoadedRef.current) {
        tilesLoadedRef.current = true;
        setTimeout(() => onTilesLoadedRef.current(), 1000);
      }
      return () => {
         if (layerRef.current && map) {
            try {
               map.removeLayer(layerRef.current);
            } catch(e) {}
            layerRef.current = null;
         }
      }
    }
  }, [map]);

  return null;
}


const retryAsync = async (asyncFn, args, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFn(args);
    } catch (error) {
      lastError = error;
      console.error(`Request failed (attempt ${i + 1}/${maxRetries}):`, error);
      if (i < maxRetries - 1) {
        console.log(
          `Retrying in ${delay * (i + 1)}ms (attempt ${i + 2}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
};

const getQueryParams = () => {
  const search = window.location.search.substring(1);
  const params = {};
  search.split("&").forEach((param) => {
    const [key, value] = param.split("=");
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

// Updated marker function to match RouteInfo.aspx styling
function createColoredMarker(color, stopNo, gender) {
  const genderInitial = gender ? gender.charAt(0).toUpperCase() : '';
  const markerText = `${stopNo}${genderInitial}`;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="white" stroke="#333" stroke-width="2"/>
      <circle cx="18" cy="18" r="14" fill="${color}"/>
      <text x="18" y="23" text-anchor="middle" 
            font-family="Arial Black, sans-serif" 
            font-size="12" 
            font-weight="900" 
            fill="white" 
            stroke="rgba(0,0,0,0.8)" 
            stroke-width="2" 
            paint-order="stroke fill">${markerText}</text>
    </svg>
  `;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

const colors = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#A142F4",
  "#F44292",
  "#00B8D9",
  "#FF6D01",
  "#46BDC6",
  "#FFB300",
  "#8E24AA",
  "#43A047",
  "#F4511E",
  "#3949AB",
  "#757575",
  "#C0CA33",
  "#D81B60",
  "#00897B",
  "#6D4C41",
  "#7E57C2",
];

function FitMapToRoutes({ routes }) {
  const map = useMap();
  useEffect(() => {
    if (!routes || !routes.length) return;
    let bounds = [];
    routes.forEach((route) => {
      if (route.geometry) {
        try {
          const coords = polylineUtil
            .decode(route.geometry)
            .map((coord) => [coord[0], coord[1]]);
          bounds = bounds.concat(coords);
        } catch (e) {
          console.error("Error decoding polyline for fitBounds:", e);
        }
      }
      if (route.stops) {
        bounds = bounds.concat(
          route.stops
            .filter((stop) => stop.locationY && stop.locationX)
            .map((stop) => [
              parseFloat(stop.locationY),
              parseFloat(stop.locationX),
            ])
        );
      }
    });
    if (bounds.length) {
      const basePadding = 40;
      const paddingMultiplier = Math.min(1 + (routes.length * 0.05), 2);
      const padding = Math.floor(basePadding * paddingMultiplier);
      
      const maxZoom = routes.length > 10 ? 12 : 
                     routes.length > 5 ? 11 : 
                     routes.length > 1 ? 12 : 13;
      
      map.fitBounds(bounds, { 
        padding: [padding, padding],
        maxZoom: maxZoom
      });
    }
  }, [routes, map]);
  return null;
}

const safeParseJson = (data, fieldName = "response") => {
  let parsedData = data;
  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      console.error(`Initial JSON.parse failed for ${fieldName}:`, e, data);
      throw new Error(`Invalid JSON string in ${fieldName}`);
    }
  }
  if (typeof parsedData === "string") {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      console.warn(
        `Secondary JSON.parse failed for ${fieldName}, using as is:`,
        e,
        parsedData
      );
    }
  }
  return parsedData;
};

const callRecalculateAPI = async (inputData) => {
  return ManageRouteService.recalculateRoutes(inputData);
};

const VehicleIcon = ({ type, isActive }) => {
  const getVehicleImage = (type) => {
    switch (type) {
      case "s":
        return "images/icons/letter-s.png";
      case "m":
        return "images/icons/letter-m.png";
      case "l":
        return "images/icons/letter-l.png";
      default:
        return null;
    }
  };
  const imageSrc = getVehicleImage(type);
  if (!imageSrc) return null;
  return (
    <img
      src={imageSrc}
      alt={type.toUpperCase()}
      style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
      title={`${type.toUpperCase()} Vehicle`}
    />
  );
};

const GuardIcon = ({ isActive }) => (
  <img
    src="images/icons/add_guard.png"
    alt="Guard"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Guard Required"
  />
);

const SwappedIcon = ({ isActive }) => (
  <img
    src="images/icons/swap.png"
    alt="Swapped"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Swapped Route"
  />
);

const PWDIcon = ({ isActive }) => (
  <img
    src="images/icons/pwd.png"
    alt="PWD"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="PWD"
  />
);

const MedicalIcon = ({ isActive }) => (
  <img
    src="images/icons/medical.png"
    alt="Medical"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Medical Required"
  />
);

const NonMotorableIcon = ({ isActive }) => (
  <img
    src="images/icons/non-motorable.png"
    alt="NMT"
    style={{ width: "20px", height: "20px", opacity: isActive ? 0.7 : 1 }}
    title="Non Motorable"
  />
);

export default function RouteMap() {
  const [allRouteMetas, setAllRouteMetas] = useState([]);
  const [fetchedRoutesData, setFetchedRoutesData] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);
  const [queryParams, setQueryParams] = useState({});
  const [ParsedRouteStats, setParsedRouteStats] = useState([]);

  useEffect(() => {
    const params = getQueryParams();
    setQueryParams(params);
  }, []);

  const locationOptions = useMemo(() => {
    if (!allRouteMetas || allRouteMetas.length === 0) return [];
    
    const locations = allRouteMetas
      .map(route => route.Location)
      .filter(location => location && location.trim() !== "")
      .filter((location, index, self) => self.indexOf(location) === index)
      .sort();
    
    return locations.map(location => ({
        label: location,
        value: location
    }));
  }, [allRouteMetas]);

  const filteredRouteMetas = useMemo(() => {
    if (!selectedLocation || selectedLocation.length === 0) {
      return allRouteMetas;
    }
    return allRouteMetas.filter(route => selectedLocation.includes(route.Location));
  }, [allRouteMetas, selectedLocation]);

  const fetchRouteDetailsAndGeometry = useCallback(
    async (routeID, existingRouteMeta) => {
      try {
        const [detailsResponse, geometryResponse] = await Promise.all([
          retryAsync(ManageRouteService.GetRoutesDetailsnew, {
            RouteID: routeID,
            isAdd: 0,
          }),
          retryAsync(ManageRouteService.Get_RouteGeometry, {
            RouteID: routeID,
          }),
        ]);
        const detailsData = safeParseJson(detailsResponse, "details API");
        if (!detailsData || !Array.isArray(detailsData)) {
          throw new Error(
            "Invalid details data structure from GetRoutesDetailsnew"
          );
        }
        let geometryData = safeParseJson(geometryResponse, "geometry API");
        if (Array.isArray(geometryData) && geometryData.length > 0) {
          geometryData = geometryData[0];
        }
        if (!geometryData || !geometryData.geometry) {
          throw new Error(
            "Invalid geometry data structure from Get_RouteGeometry"
          );
        }
        const stops = detailsData.map((emp) => ({
          stopNo: emp.stopNo,
          address: emp.address,
          empCode: emp.empCode,
          empName: emp.empName,
          eta: emp.ETA,
          locationX: emp.GeoX,
          locationY: emp.GeoY,
          gender: emp.Gender
        }));
        return {
          ...existingRouteMeta,
          routeid: routeID,
          geometry: geometryData.geometry,
          stops,
          facility: {
            facilityGeoX: detailsData[0]?.facGeoX,
            facilityGeoY: detailsData[0]?.facGeoY,
          },
        };
      } catch (err) {
        console.error(`Error fetching full data for route ${routeID}:`, err);
        setError(`Failed to load details for route ${routeID}. ${err.message}`);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (
      !queryParams.sDate ||
      !queryParams.FacilityID ||
      !queryParams.TripType
    ) {
      setLoading(false);
      return;
    }
    
    const fetchInitialData = async () => {
      setLoading(true);
      setIsMapReady(false);
      setMapTilesLoaded(false);
      setError(null);
      setAllRouteMetas([]);
      setFetchedRoutesData({});
      setRouteVisible({});
      setShowAll(false);
      setSelectedLocation([]);
      setIsRecalculating(false);
      
      try {
        const apiParams = {
          sDate: queryParams.sDate,
          eDate: queryParams.sDate,
          FacilityID: queryParams.FacilityID,
          TripType: queryParams.TripType,
          Shifttimes: queryParams.Shifttimes || "0900",
          OrderBy: "Colony",
          Direction: queryParams.Direction || "ASC",
          Routeid: "",
          occ_seater: -2,
        };
        
        console.log("Fetching routes by order...");
        const routesResponse = await retryAsync(
          ManageRouteService.GetRoutesByOrder,
          apiParams
        );
        const parsedRoutesMeta = safeParseJson(
          routesResponse,
          "GetRoutesByOrder"
        );

        if (!parsedRoutesMeta || !Array.isArray(parsedRoutesMeta)) {
          throw new Error(
            "Invalid response from GetRoutesByOrder: expected array"
          );
        }

        console.log("Routes metadata fetched:", parsedRoutesMeta.length, "routes");

        if (parsedRoutesMeta.length > 0) {
          const routeIds = parsedRoutesMeta.map(route => route.RouteID).join(',');
          console.log("Checking for route updates with IDs:", routeIds);
          
          try {
            const inputJsonResponse = await retryAsync(
              ManageRouteService.getInputJsonByrouteids,
              { routeids: routeIds }
            );
            
            const inputJsonData = safeParseJson(inputJsonResponse, "getInputJsonByrouteids");
            console.log("Input JSON response:", inputJsonData);
            
            if (inputJsonData && inputJsonData.routes && inputJsonData.routes.length > 0) {
              console.log("Routes need recalculation, starting recalculation process...");
              
              setLoading(false);
              await new Promise(resolve => setTimeout(resolve, 300));
              setIsRecalculating(true);
              
              try {
                const recalculateData = await callRecalculateAPI(inputJsonData);
                console.log("Recalculate API response received");
                
                await retryAsync(
                  ManageRouteService.updateRouteMapbased,
                  {
                    facilityid: queryParams.FacilityID,
                    sDate: queryParams.sDate,
                    triptype: queryParams.TripType,
                    shifttime: queryParams.Shifttimes || "0900",
                    jsonstring: JSON.stringify(recalculateData),
                    updatedBy: 0
                  }
                );
                console.log("Routes updated successfully in database");
                
              } catch (recalcError) {
                console.error("Error during recalculation process:", recalcError);
                setError(`Failed to recalculate routes: ${recalcError.message}`);
              } finally {
                setIsRecalculating(false);
                await new Promise(resolve => setTimeout(resolve, 300));
                setLoading(true);
              }
            } else {
              console.log("No route updates needed, proceeding with normal flow");
            }
            
          } catch (updateCheckError) {
            console.error("Error checking for route updates:", updateCheckError);
            setError(`Failed to check for route updates: ${updateCheckError.message}`);
          }
        }

        const routeStats = {
          sdate: queryParams.sDate,
          edate: queryParams.sDate,
          triptype: queryParams.TripType,
          facilityid: queryParams.FacilityID,
          shifttime: queryParams.Shifttimes || "0900",
        };

        const routeStatsResponse = await retryAsync(
          ManageRouteService.GetRoutesStatistics,
          routeStats
        );
        const parsedRouteStats = safeParseJson(routeStatsResponse, "GetRouteStats");
        console.log("Route Stats:", parsedRouteStats);      
        setParsedRouteStats(parsedRouteStats);

        setAllRouteMetas(parsedRoutesMeta);
        
        if (parsedRoutesMeta.length > 0) {
          const firstRouteMeta = parsedRoutesMeta[0];
          const firstRouteFullData = await fetchRouteDetailsAndGeometry(
            firstRouteMeta.RouteID,
            firstRouteMeta
          );
          if (firstRouteFullData) {
            setFetchedRoutesData((prev) => ({
              ...prev,
              [firstRouteMeta.RouteID]: firstRouteFullData,
            }));
            setRouteVisible({ [firstRouteMeta.RouteID]: true });
          } else {
            setError(
              `Failed to load data for the first route (${firstRouteMeta.RouteID}).`
            );
          }
        }
        
        setIsMapReady(true);

      } catch (err) {
        console.error("Error fetching initial route data:", err);
        setError(err.message || "Error during initial load.");
        setIsMapReady(false);
      } finally {
        setLoading(false);
        setIsRecalculating(false);
      }
    };
    
    fetchInitialData();

    // Safety timeout to prevent infinite loader
    const safetyTimeout = setTimeout(() => {
       if (loading || isRouteLoading || (isMapReady && !mapTilesLoaded)) {
          console.warn("Forcing loader dismissal due to timeout");
          setLoading(false);
          setIsRouteLoading(false);
          setMapTilesLoaded(true);
       }
    }, 10000);

    return () => clearTimeout(safetyTimeout);
  }, [queryParams, fetchRouteDetailsAndGeometry]);

  const displayRoutes = useMemo(() => {
    return filteredRouteMetas.map((meta) => {
      const fetchedDetail = fetchedRoutesData[meta.RouteID];
      if (fetchedDetail) return fetchedDetail;
      return {
        ...meta,
        routeid: meta.RouteID,
        stops: [],
        geometry: null,
        facility: {},
      };
    });
  }, [filteredRouteMetas, fetchedRoutesData]);

  const routesForMap = useMemo(() => {
    return displayRoutes.filter(
      (route) => routeVisible[route.routeid] && route.geometry
    );
  }, [displayRoutes, routeVisible]);

  const totalDistance = useMemo(
    () =>
      filteredRouteMetas.reduce(
        (sum, route) => sum + (parseFloat(route.totaldist) || 0),
        0
      ),
    [filteredRouteMetas]
  );
  const totalEmployees = useMemo(
    () =>
      filteredRouteMetas.reduce(
        (sum, route) => sum + (parseInt(route.totalStop, 10) || 0),
        0
      ),
    [filteredRouteMetas]
  );

  const handleLocationChange = (e) => {
    const newLocation = e.value;
    setSelectedLocation(newLocation);
    setShowAll(false);
    setRouteVisible({});
  };

  const handleToggleAll = async (checked) => {
    setShowAll(checked);
    if (checked) {
      setIsRouteLoading(true);
      const routesToFetchDetailsFor = filteredRouteMetas.filter(
        (meta) => !fetchedRoutesData[meta.RouteID]
      );
      const newDetailsPromises = routesToFetchDetailsFor.map((meta) =>
        fetchRouteDetailsAndGeometry(meta.RouteID, meta)
      );
      try {
        const newlyFetchedDetails = await Promise.all(newDetailsPromises);
        const newFetchedDataUpdate = {};
        newlyFetchedDetails.forEach((routeData) => {
          if (routeData) newFetchedDataUpdate[routeData.routeid] = routeData;
        });
        setFetchedRoutesData((prev) => ({ ...prev, ...newFetchedDataUpdate }));
        const allVisible = {};
        filteredRouteMetas.forEach((meta) => (allVisible[meta.RouteID] = true));
        setRouteVisible(allVisible);
      } catch (err) {
        setError("Some routes could not be loaded. " + err.message);
        const currentVis = { ...routeVisible };
        filteredRouteMetas.forEach((meta) => {
          if (
            fetchedRoutesData[meta.RouteID] ||
            newFetchedDataUpdate[meta.RouteID]
          ) {
            currentVis[meta.RouteID] = true;
          }
        });
        setRouteVisible(currentVis);
      } finally {
        setIsRouteLoading(false);
      }
    } else {
      const noneVisible = {};
      filteredRouteMetas.forEach((meta) => (noneVisible[meta.RouteID] = false));
      setRouteVisible(noneVisible);
    }
  };

  const handleToggleRoute = async (routeid) => {
    const isCurrentlyVisible = !!routeVisible[routeid];
    const makeVisible = !isCurrentlyVisible;
    let operationSuccess = true;
    if (makeVisible && !fetchedRoutesData[routeid]) {
      setIsRouteLoading(true);
      const routeMeta = filteredRouteMetas.find((meta) => meta.RouteID === routeid);
      if (routeMeta) {
        const routeFullData = await fetchRouteDetailsAndGeometry(
          routeid,
          routeMeta
        );
        if (routeFullData) {
          setFetchedRoutesData((prev) => ({
            ...prev,
            [routeid]: routeFullData,
          }));
        } else operationSuccess = false;
      } else {
        operationSuccess = false;
        setError(`Route metadata not found for ${routeid}.`);
      }
      setIsRouteLoading(false);
    }
    if (operationSuccess) {
      setRouteVisible((prev) => {
        const updated = { ...prev, [routeid]: makeVisible };
        setShowAll(
          filteredRouteMetas.length > 0 &&
            filteredRouteMetas.every((meta) => updated[meta.RouteID])
        );
        return updated;
      });
    }
  };

  const showFullScreenLoader = loading || isRouteLoading || (isMapReady && !mapTilesLoaded);

  const RecalculatingScreen = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        opacity: isRecalculating ? 1 : 0,
        visibility: isRecalculating ? "visible" : "hidden",
        transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
      }}
    >
      <div style={{ width: "100px", height: "100px", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "4px solid #e2e8f0",
            borderTopColor: "#f59e0b",
            borderRadius: "50%",
            animation: "spin 1.2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "70%",
            height: "70%",
            top: "15%",
            left: "15%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#10b981",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite reverse",
          }}
        />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "pulse 2s ease-in-out infinite",
        }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.382v8.764a1 1 0 01-.553.894L15 17l-6-3z"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <path
              d="M9 4v16"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 7v10"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1e293b",
            margin: 0,
          }}
        >
          Optimizing Routes
        </h2>
        <p style={{ fontSize: "16px", color: "#64748b", margin: 0, textAlign: "center" }}>
          We're recalculating your routes for better efficiency...
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              opacity: "0.3",
              animation: `progressDot 1.6s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }
        @keyframes progressDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10001,
        background: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        borderLeft: "4px solid #ef4444",
        opacity: error ? 1 : 0,
        visibility: error ? "visible" : "hidden",
        transform: error ? "translateX(0)" : "translateX(100%)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            fontWeight: "600",
          }}
        >
          !
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1e293b",
            }}
          >
            Error Loading Routes
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );

  const componentStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .sidebar-react {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1000;
      background: white;
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      width: 300px;
      font-family: 'Inter', sans-serif;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 15px;
    }
    .stat-item {
      background: #f8fafc;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.2s ease;
    }
    .stat-item:nth-child(1) { background: #dbeafe; }
    .stat-item:nth-child(2) { background: #dcfce7; }
    .stat-item:nth-child(3) { background: #fef9c3; }
    .stat-item:nth-child(4) { background: #fee2e2; }
    .stat-label {
      color: #475569;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .stat-value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
    }
    
    .location-filter-container {
      margin-bottom: 12px;
      padding: 0 2px;
    }
    .location-filter-label {
      font-weight: 600;
      color: #1e293b;
      font-size: 13px;
      margin-bottom: 6px;
      display: block;
    }
    .location-filter-container .p-multiselect {
      width: 100%;
      font-family: 'Inter', sans-serif;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
    }
    .location-filter-container .p-multiselect .p-multiselect-label {
      font-size: 14px;
      padding: 8px 12px;
      color: #374151;
    }
    .location-filter-container .p-multiselect:not(.p-disabled):hover {
      border-color: #9ca3af;
    }
    .location-filter-container .p-multiselect:not(.p-disabled).p-focus {
      outline: none;
      outline-offset: 0;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }
    .location-filter-container .p-multiselect-panel {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-radius: 6px;
      border: 1.5px solid #e2e8f0;
    }
    .location-filter-container .p-multiselect-header {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .location-filter-container .p-multiselect-filter-container {
      width: 100%;
    }
    .location-filter-container .p-multiselect-filter {
      width: 100%;
      padding: 8px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .location-filter-container .p-multiselect-filter:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .location-filter-container .p-multiselect-filter-icon {
      right: 12px;
      color: #6b7280;
    }
    .location-filter-container .p-multiselect-close {
      display: none;
    }
    .location-filter-container .p-checkbox .p-checkbox-box {
      border: 1.5px solid #d1d5db;
      border-radius: 4px;
      width: 18px;
      height: 18px;
    }
    .location-filter-container .p-checkbox .p-checkbox-box.p-highlight {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    .location-filter-container .p-multiselect-items .p-multiselect-item {
      font-size: 14px;
      padding: 8px 12px;
      color: #374151;
      font-family: 'Inter', sans-serif;
    }
    .location-filter-container .p-multiselect-items .p-multiselect-item:not(.p-highlight):not(.p-disabled):hover {
      background: #f3f4f6;
      color: #1e293b;
    }
    .location-filter-container .p-multiselect-items .p-multiselect-item.p-highlight {
      background: #eff6ff;
      color: #1e40af;
    }
    .location-filter-container .p-multiselect-empty-message {
      padding: 12px;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }
    
    .sidebar-switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding: 0 2px;
    }
    .switch-label {
      font-weight: 600;
      color: #1e293b;
      font-size: 15px;
      user-select: none;
    }
    .route-item {
      font-size: 14px;
      padding: 0px;
      margin:0 0 6px 0;
      height: auto;
      width: 100%;
      cursor: pointer;
    }
    .route-summary {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 0px;
      transition: all 0.3s ease;
      color: #1e293b;
      font-size: 12px;
      line-height: 1.2;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .route-summary:hover {
      background: #f3f4f6;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    .route-summary.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .route-summary.active .route-name span {
        color: white;
    }
    .route-summary .route-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .route-icons-container {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      min-width: fit-content;
    }
    .route-icons-container img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
    .route-summary.active .route-icons-container img {
       opacity: 0.7;
    }
    .route-summary .route-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      font-size: 14px;
      color: #475569;
    }
    .route-summary .route-stats .stat-item {
      background: #f9fafb;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.3s ease;
    }
    .route-summary .route-stats .stat-item:hover {
      background: #f3f4f6;
    }
    .route-summary .route-stats .stat-label {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 8px;
      color: #6b7280;
    }
    .route-summary .route-stats .stat-value {
      font-weight: 700;
      color: #111827;
      transition: color 0.2s;
    }
    .route-summary.active .route-stats .stat-item {
      background: rgba(255,255,255,0.92);
    }
    .route-summary.active .route-stats .stat-label {
      color: #2563eb;
    }
    .route-summary.active .route-stats .stat-value {
      color: #2563eb;
    }

    .info-window {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      max-width: 220px;
      padding: 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }
    .info-header {
      font-weight: 700;
      font-size: 13px;
      padding: 8px 28px 8px 12px;
      color: white;
      background: var(--route-color, #2563eb);
      border-bottom: none;
      position: relative;
    }
    .stop-route-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stop-label, .route-label {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .stop-number, .route-number {
      font-weight: 700;
      color: white;
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
    .employee-details {
      list-style: none;
      padding: 8px 10px;
      margin: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 8px;
      background: rgba(var(--route-color-rgb, 37, 99, 235), 0.08);
    }
    .employee-details li { display: contents; }
    .employee-details strong {
      color: #475569;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
      grid-column: 1;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    .employee-details li > span {
      color: #1e293b;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      text-align: right;
      word-break: break-word;
      grid-column: 2;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    .employee-details li:last-child strong,
    .employee-details li:last-child span {
        border-bottom: none;
        padding-bottom: 0;
    }

    .leaflet-popup-content {
      margin: 0 !important;
      font-family: 'Inter', sans-serif;
      padding: 0 !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px !important;
      box-shadow: none !important;
      padding: 0 !important;
      background-color: transparent !important;
    }
    .leaflet-popup-tip {
       background-color: white !important;
       box-shadow: none !important;
    }
    .leaflet-popup-close-button {
      color: rgba(255, 255, 255, 0.85) !important;
      font-size: 18px !important;
      font-weight: bold !important;
      line-height: 20px !important;
      text-align: center !important;
      text-decoration: none !important;
      transition: all 0.2s ease !important;
      position: absolute !important;
      top: 4px !important;
      right: 4px !important;
      width: 20px !important;
      height: 20px !important;
      background: transparent !important;
      border-radius: 50% !important;
      z-index: 10 !important;
      padding: 0 !important;
    }
    .leaflet-popup-close-button:hover {
      color: white !important;
      background: rgba(0, 0, 0, 0.2) !important;
    }

    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    }
    .leaflet-control-zoom a {
      background: #fff !important;
      color: #333 !important;
      font-size: 18px !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
    }
    .leaflet-control-zoom a:hover {
      background: #f5f5f5 !important;
    }
  `;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        fontFamily: "'Inter', sans-serif",
        background: "#f6f8fa",
      }}
    >
      <style>{componentStyles}</style>
      <Loader isVisible={showFullScreenLoader} fullScreen={true} />
      <RecalculatingScreen />
      {error && <ErrorMessage message={error} />}

      {isMapReady && (
        <>
          <div className="sidebar-react">
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-label">Routes</div>
                <div className="stat-value">{filteredRouteMetas.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Distance</div>
                <div className="stat-value">{totalDistance.toFixed(1)} km</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Employees</div>
                <div className="stat-value">{totalEmployees}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Avg Occupancy</div>
                <div className="stat-value">{ParsedRouteStats[0]?.AvgOccupancy}</div>
              </div>
            </div>
            
            <div className="location-filter-container">
              <label className="location-filter-label">Filter by Location:</label>
              <MultiSelect
                value={selectedLocation}
                options={locationOptions}
                onChange={handleLocationChange}
                optionLabel="label"
                placeholder="Select Locations"
                display="chip"
                maxSelectedLabels={2}
                filter
                filterPlaceholder="Search locations..."
                filterBy="label"
                showSelectAll={true}
                selectAllLabel="Select All"
                emptyFilterMessage="No locations found"
              />
            </div>
            
            <div className="sidebar-switch-row">
              <span className="switch-label">Show All Routes</span>
              <label
                className="switch"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: 44,
                  height: 24,
                }}
              >
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className="slider"
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: showAll ? "#3b82f6" : "#e5e7eb",
                    transition: ".3s",
                    borderRadius: 24,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: 18,
                      width: 18,
                      left: showAll ? 23 : 3,
                      bottom: 3,
                      backgroundColor: "#fff",
                      transition: ".3s",
                      borderRadius: "50%",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      display: "block",
                    }}
                  />
                </span>
              </label>
            </div>
            <div id="route-buttons">
              {displayRoutes.map((route, idx) => {
                const isActive = !!routeVisible[route.routeid];
                const originalIndex = allRouteMetas.findIndex(meta => meta.RouteID === route.routeid);
                return (
                  <div className="route-item" key={route.routeid}>
                    <div
                      className={`route-summary${isActive ? " active" : ""}`}
                      data-routeid={route.routeid}
                      style={{
                        borderLeft: `6px solid ${colors[originalIndex % colors.length]}`,
                      }}
                      onClick={() => handleToggleRoute(route.routeid)}
                    >
                      <div className="route-name">
                        <span>Route {route.routeid}</span>
                        <div className="route-icons-container">
                          {route.varvehicleType && (
                            <VehicleIcon
                              type={route.varvehicleType}
                              isActive={isActive}
                            />
                          )}
                          {route.PlannedGuard == 1 && <GuardIcon isActive={isActive} />}
                          {(route.swapped === true || route.swapped === "true") && (
                            <SwappedIcon isActive={isActive} />
                          )}
                          {route.isPWD && <PWDIcon isActive={isActive} />}
                          {route.isMedical && <MedicalIcon isActive={isActive} />}
                          {route.isNMT && <NonMotorableIcon isActive={isActive} />}
                        </div>
                      </div>
                      <div className="route-stats">
                        <div className="stat-item">
                          <div className="stat-label">Distance</div>
                          <div className="stat-value">
                            {route.totaldist && !isNaN(parseFloat(route.totaldist))
                              ? `${parseFloat(route.totaldist).toFixed(1)} km`
                              : "—"}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Occupancy</div>
                          <div className="stat-value">
                            {route.totalStop !== undefined &&
                            !isNaN(parseInt(route.totalStop, 10))
                              ? `${parseInt(route.totalStop, 10)}`
                              : "—"}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Duration</div>
                          <div className="stat-value">
                            {route.duration && !isNaN(parseInt(route.duration, 10))
                              ? `${parseInt(route.duration, 10)} min`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={6}
            style={{ height: "100vh", width: "100vw", zIndex: 1 }}
            zoomControl={false}
            zoomSnap={0.25}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120}
          >
            <FitMapToRoutes routes={routesForMap} />
            <MapLibreLayer onTilesLoaded={() => setMapTilesLoaded(true)} />
            <ZoomControl position="topright" />
            {routesForMap.map((route) => {
              const originalIndex = allRouteMetas.findIndex(meta => meta.RouteID === route.routeid);
              const routeColor = colors[originalIndex % colors.length];
              const routeColorRgb = hexToRgb(routeColor);
              return (
                <LayerGroup key={route.routeid}>
                  {route.geometry && (
                    <Polyline
                      positions={polylineUtil
                        .decode(route.geometry)
                        .map((coord) => [coord[0], coord[1]])}
                      color={routeColor}
                      weight={4}
                      opacity={0.8}
                    />
                  )}
                  {route.stops &&
                    route.stops.map((stop, sidx) => {
                      const lat = parseFloat(stop.locationY);
                      const lng = parseFloat(stop.locationX);
                      if (isNaN(lat) || isNaN(lng)) return null;
                      return (
                        <Marker
                          key={`${route.routeid}-stop-${sidx}`}
                          position={[lat, lng]}
                          icon={createColoredMarker(routeColor, stop.stopNo, stop.gender)}
                        >
                          <Popup>
                            <div
                              className="info-window"
                              style={{
                                "--route-color": routeColor,
                                "--route-color-rgb": routeColorRgb,
                              }}
                            >
                              <div className="info-header">
                                <div className="stop-route-info">
                                  <span className="stop-label">
                                    Stop <span className="stop-number">{stop.stopNo}</span>
                                  </span>
                                  <span className="route-label">
                                    Route <span className="route-number">{route.routeid}</span>
                                  </span>
                                </div>
                              </div>
                              <ul className="employee-details">
                                <li>
                                  <strong>Emp Name</strong>
                                  <span>{stop.empName || "N/A"}</span>
                                </li>
                                <li>
                                  <strong>Emp Code</strong>
                                  <span>{stop.empCode || "N/A"}</span>
                                </li>
                                <li>
                                  <strong>Address</strong>
                                  <span>{stop.address || "No address"}</span>
                                </li>
                                <li>
                                  <strong>ETA</strong>
                                  <span>{stop.eta || "N/A"}</span>
                                </li>
                                <li>
                                  <strong>Gender</strong>
                                  <span>{stop.gender || "N/A"}</span>
                                </li>
                              </ul>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  {route.facility &&
                    route.facility.facilityGeoY &&
                    route.facility.facilityGeoX && (
                      <Marker
                        key={`${route.routeid}-facility`}
                        position={[
                          parseFloat(route.facility.facilityGeoY),
                          parseFloat(route.facility.facilityGeoX),
                        ]}
                        icon={
                          new L.Icon({
                            iconUrl: "images/icons/facility.png",
                            iconSize: [36, 36],
                            iconAnchor: [18, 36],
                            popupAnchor: [0, -36],
                          })
                        }
                      >
                        <Popup><b>Facility</b></Popup>
                      </Marker>
                    )}
                </LayerGroup>
              );
            })}
          </MapContainer>
        </>
      )}
    </div>
  );
}