import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import type { Locations } from "../shared/contracts";
import { categories, searchInput } from "../shared/contracts";
import { useLanguage } from "../lib/i18n";
import { Button, C, Field, Notice, useWide } from "./ui";
import Select from "./Select";
type Values = Record<string, string>;
export default function SearchForm({
  locations,
  compact = false,
  initial = {},
}: {
  locations: Locations;
  compact?: boolean;
  initial?: Values;
}) {
  const { t, locale } = useLanguage();
  const wide = useWide();
  const fieldId = (name: string) => `${name}-${wide ? "wide" : "narrow"}`;
  const [values, setValues] = useState<Values>({
    ...initial,
    transaction: initial.transaction || "sale",
  });
  const [error, setError] = useState("");
  const initialKey = JSON.stringify(initial);
  useEffect(() => {
    setValues({ ...initial, transaction: initial.transaction || "sale" });
  }, [initialKey]);
  function update(k: string, v: string) {
    setValues((previous) => ({
      ...previous,
      [k]: v,
      ...(k === "cityId" ? { townshipId: "" } : {}),
      ...(k === "category" && v === "land" ? { bedrooms: "" } : {}),
      ...(k === "currency" && !v
        ? { minPrice: "", maxPrice: "", sort: "newest" }
        : {}),
    }));
  }
  function search() {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([k, v]) => v !== "" && k !== "page"),
    );
    const parsed = searchInput.safeParse(cleaned);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setError("");
    router.push({ pathname: "/properties", params: cleaned });
  }
  const locName = (l: Locations["cities"][number]) =>
    locale === "my" ? l.nameMy : l.nameEn;
  const fields = (
    <>
      <Select
        id={fieldId("search-city")}
        label={t("city")}
        value={values.cityId || ""}
        onChange={(v) => update("cityId", v)}
        options={[
          { value: "", label: t("allCities") },
          ...locations.cities.map((l) => ({ value: l.id, label: locName(l) })),
        ]}
      />
      <Select
        id={fieldId("search-township")}
        label={t("township")}
        value={values.townshipId || ""}
        onChange={(v) => update("townshipId", v)}
        disabled={!values.cityId}
        options={[
          { value: "", label: t("allTownships") },
          ...locations.townships
            .filter((l) => l.cityId === values.cityId)
            .map((l) => ({ value: l.id, label: locName(l) })),
        ]}
      />
      <Select
        id={fieldId("search-category")}
        label={t("category")}
        value={values.category || ""}
        onChange={(v) => update("category", v)}
        options={[
          { value: "", label: t("allTypes") },
          ...categories.map((c) => ({ value: c, label: t(c) })),
        ]}
      />
    </>
  );
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          small
          variant={values.transaction === "sale" ? "primary" : "ghost"}
          onPress={() => update("transaction", "sale")}
        >
          {t("buy")}
        </Button>
        <Button
          small
          variant={values.transaction === "rent" ? "primary" : "ghost"}
          onPress={() => update("transaction", "rent")}
        >
          {t("rent")}
        </Button>
      </View>
      {compact ? (
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            gap: 16,
            alignItems: wide ? "flex-end" : "stretch",
          }}
        >
          {fields}
          <Button icon="search" onPress={search}>
            {t("search")}
          </Button>
        </View>
      ) : (
        <>
          <Field
            label={t("keyword")}
            value={values.q || ""}
            onChangeText={(v) => update("q", v)}
            placeholder={t("keywordPlaceholder")}
            onSubmitEditing={search}
          />
          {fields}
          <Select
            id={fieldId("search-currency")}
            label={t("currency")}
            value={values.currency || ""}
            onChange={(v) => update("currency", v)}
            options={[
              { value: "", label: t("anyCurrency") },
              { value: "MMK", label: "MMK" },
              { value: "USD", label: "USD" },
            ]}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("minPrice")}
                value={values.minPrice || ""}
                onChangeText={(v) => update("minPrice", v)}
                keyboardType="numeric"
                editable={!!values.currency}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("maxPrice")}
                value={values.maxPrice || ""}
                onChangeText={(v) => update("maxPrice", v)}
                keyboardType="numeric"
                editable={!!values.currency}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("minArea")}
                value={values.minArea || ""}
                onChangeText={(v) => update("minArea", v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("maxArea")}
                value={values.maxArea || ""}
                onChangeText={(v) => update("maxArea", v)}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Select
            id={fieldId("search-bedrooms")}
            label={t("bedrooms")}
            value={values.bedrooms || ""}
            onChange={(v) => update("bedrooms", v)}
            disabled={values.category === "land"}
            options={[
              { value: "", label: t("anyBedrooms") },
              ...[1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n}+`,
              })),
            ]}
          />
          <Select
            id={fieldId("search-sort")}
            label={t("sort")}
            value={values.sort || "newest"}
            onChange={(v) => update("sort", v)}
            options={[
              { value: "newest", label: t("newest") },
              ...(values.currency
                ? [
                    { value: "price-asc", label: t("priceAsc") },
                    { value: "price-desc", label: t("priceDesc") },
                  ]
                : []),
            ]}
          />
          <Button icon="search" onPress={search}>
            {t("apply")}
          </Button>
          <Button variant="ghost" onPress={() => router.push("/properties")}>
            {t("reset")}
          </Button>
        </>
      )}
      <Notice message={error} error />
    </View>
  );
}
