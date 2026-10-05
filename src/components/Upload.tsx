import React from "react";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../lib/i18n";
import { Button } from "./ui";
export interface UploadProps {
  onUpload: (form: FormData) => Promise<void>;
  disabled?: boolean;
}
export default function Upload({ onUpload, disabled }: UploadProps) {
  const { t } = useLanguage();
  return (
    <Button
      disabled={disabled}
      onPress={async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          quality: 0.85,
        });
        if (result.canceled) return;
        const form = new FormData();
        result.assets.forEach((asset) =>
          form.append("photos", {
            uri: asset.uri,
            name: asset.fileName || "photo.jpg",
            type: asset.mimeType || "image/jpeg",
          } as any),
        );
        await onUpload(form);
      }}
    >
      {t("addPhotos")}
    </Button>
  );
}
