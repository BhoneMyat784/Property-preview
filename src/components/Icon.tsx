import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";
export type IconName =
  | "home"
  | "search"
  | "arrow"
  | "pin"
  | "heart"
  | "bed"
  | "bath"
  | "area"
  | "building"
  | "land"
  | "plus"
  | "menu"
  | "check"
  | "close"
  | "phone";
const paths: Partial<Record<IconName, string>> = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  search: "m21 21-5-5",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  pin: "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  bed: "M3 18V7m0 8h18v3m0-3v-5a2 2 0 0 0-2-2h-7v7M3 11h9M3 21v-3m18 3v-3",
  bath: "M3 12h18v3a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6Zm3 0V5a2 2 0 0 1 4 0m-5 16v2m14-2v2",
  area: "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M7 7l10 10m0-10L7 17",
  building: "M5 21V3h14v18M9 7h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-4 6v-3",
  land: "m2 18 6-12 6 12m-7-2 9-13 6 15M2 21h20",
  plus: "M12 5v14M5 12h14",
  menu: "M4 6h16M4 12h16M4 18h16",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3l2 5-3 2a16 16 0 0 0 7 7l2-3Z",
};
export function Icon({
  name,
  size = 20,
  color = "#244c40",
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name]} />
      {name === "search" && <Circle cx="10.5" cy="10.5" r="6.5" />}
      {name === "pin" && <Circle cx="12" cy="10" r="2.5" />}
    </Svg>
  );
}
