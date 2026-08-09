import { GeoJSON } from "react-leaflet";

export const FAULT_COLOR = "#a78bfa";
export const TRENCH_COLOR = "#2dd4bf";

const faultStyle = () => ({
  color: FAULT_COLOR,
  weight: 2,
  opacity: 0.75,
  dashArray: "1, 6",
  lineCap: "round",
});

const trenchStyle = () => ({
  color: TRENCH_COLOR,
  weight: 2.5,
  opacity: 0.75,
  dashArray: "1, 6",
  lineCap: "round",
});

export function FaultLinesLayer({ geologia }) {
  if (!geologia) return null;

  return (
    <>
      <GeoJSON data={geologia.fallas} style={faultStyle} />
      <GeoJSON data={geologia.fosaMesoamericana} style={trenchStyle} />
    </>
  );
}
