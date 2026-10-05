import React from "react";
import { View, Text } from "react-native";
import { useLanguage } from "../lib/i18n";
import { C, font } from "./ui";
import type { UploadProps } from "./Upload";
export default function Upload({ onUpload, disabled }: UploadProps) {
  const { t } = useLanguage();
  return (
    <View style={{ gap: 10 }}>
      <input
        type="file"
        aria-label={t("addPhotos")}
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          const input = e.target;
          if (!files.length) return;
          const form = new FormData();
          files.forEach((f) => form.append("photos", f));
          await onUpload(form);
          input.value = "";
        }}
        style={{
          fontFamily: font,
          color: C.green,
          maxWidth: "100%",
          padding: 14,
          border: `1px dashed ${C.line}`,
          borderRadius: 10,
          background: C.cream,
        }}
      />
    </View>
  );
}
