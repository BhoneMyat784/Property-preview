import React, { useEffect, useId, useState } from "react";
import { View, Text } from "react-native";
import { styles, C, font } from "./ui";
import type { SelectProps } from "./Select";
export default function Select({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: SelectProps) {
  const generatedId = useId();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const labelId = hydrated
    ? `${id}-${generatedId.replaceAll(":", "")}-label`
    : undefined;
  return (
    <View style={{ gap: 7, flexGrow: 1, minWidth: 0 }}>
      <Text nativeID={labelId} style={styles.label}>
        {label}
      </Text>
      <select
        aria-labelledby={labelId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          fontFamily: font,
          fontSize: 14,
          lineHeight: "24px",
          color: C.ink,
          border: `1px solid ${C.line}`,
          borderRadius: 9,
          padding: "10px 32px 10px 12px",
          minHeight: 46,
          backgroundColor: C.white,
          width: "100%",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </View>
  );
}
