import React, { useCallback, useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const LocationMapComponent = ({
  latitude,
  longitude,
  onCoordinatesChange,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="alert alert-danger" role="alert">
          <h6>Google Maps API Key Not Found</h6>
          <p>Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
          <small>File location: {import.meta.url}</small>
        </div>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const [markerPosition, setMarkerPosition] = useState({
    lat: parseFloat(latitude) || 28.4624669,
    lng: parseFloat(longitude) || 77.0847776,
  });

  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "400px",
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: "greedy",
  };

  const center = {
    lat: markerPosition.lat,
    lng: markerPosition.lng,
  };

  const onLoad = useCallback((map) => {
    // If map looks clipped in offcanvas, you can trigger resize:
    // setTimeout(() => window.google.maps.event.trigger(map, "resize"), 100);
  }, []);

  const onUnmount = useCallback(() => {}, []);

  const handleMarkerDragEnd = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onCoordinatesChange(lat, lng);
    },
    [onCoordinatesChange]
  );

  useEffect(() => {
    setMarkerPosition({
      lat: parseFloat(latitude) || 28.4624669,
      lng: parseFloat(longitude) || 77.0847776,
    });
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="alert alert-danger" role="alert">
          Error loading Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <Marker
        position={markerPosition}
        onDragEnd={handleMarkerDragEnd}
        draggable={true}
        title="Drag to update location"
      />
    </GoogleMap>
  );
};

export default LocationMapComponent;