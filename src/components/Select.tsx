import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { styles, C, font } from "./ui";
export interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}
export default function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 7, flexGrow: 1, zIndex: open ? 20 : 0 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(!open)}
        style={styles.input}
      >
        <Text style={{ fontFamily: font, color: C.ink }}>
          {options.find((o) => o.value === value)?.label || "—"} ▾
        </Text>
      </Pressable>
      {open && (
        <ScrollView
          style={{
            maxHeight: 230,
            backgroundColor: C.white,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 9,
          }}
        >
          {options.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{ padding: 12 }}
            >
              <Text style={{ fontFamily: font, color: C.ink }}>{o.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
