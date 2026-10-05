import React from "react";
import { useLocalSearchParams } from "expo-router";
import { Gate } from "../../../components/ui";
import ListingEditor from "../../../components/ListingEditor";
export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Gate>
      <ListingEditor id={id} />
    </Gate>
  );
}
