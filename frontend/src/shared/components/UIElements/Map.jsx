import React, { useRef, useEffect } from "react";

import "./Map.css";

// Google Map API need account with credit card binding.

const Map = (props) => {
  const mapRef = useRef();

  const { center, zoom } = props;

  useEffect(() => {
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapId: "DEMO_MAP_ID",
    });

    new window.google.maps.marker.AdvancedMarkerElement({
      position: center,
      map: map,
    });
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      className={`map ${props.className}`}
      style={props.style}
    ></div>
  );
};

export default Map;
