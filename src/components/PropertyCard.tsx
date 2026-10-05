import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Link } from "expo-router";
import { type Listing } from "../shared/contracts";
import { useLanguage } from "../lib/i18n";
import { photoUrl } from "../lib/api";
import { useFavorites } from "../lib/favorites";
import { Icon } from "./Icon";
import { Body, C, font, Notice, useViewport } from "./ui";
export function priceLabel(p: Listing) {
  return `${p.currency === "USD" ? "$" : ""}${p.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}${p.currency === "MMK" ? " MMK" : ""}`;
}
export function PropertyCard({ listing: p }: { listing: Listing }) {
  const { t, locale } = useLanguage();
  const { ids, toggle } = useFavorites();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 16,
        backgroundColor: C.white,
        overflow: "hidden",
      }}
    >
      <Link
        href={{ pathname: "/properties/[id]", params: { id: p.id } }}
        asChild
      >
        <Pressable accessibilityLabel={p.title} style={{ opacity: 1 }}>
          <Image
            source={{ uri: photoUrl(p.photos[0]?.url || "") }}
            style={{ width: "100%", height: 225, backgroundColor: C.line }}
            accessibilityLabel={p.title}
          />
          <View style={{ padding: 20, gap: 11 }}>
            <Body style={{ fontSize: 17, fontWeight: "600" }}>{p.title}</Body>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <Icon name="pin" size={15} color={C.muted} />
              <Body muted style={{ fontSize: 12 }}>
                {locale === "my" ? p.townshipNameMy : p.townshipNameEn},{" "}
                {locale === "my" ? p.cityNameMy : p.cityNameEn}
              </Body>
            </View>
            <View style={{ flexDirection: "row", gap: 15, flexWrap: "wrap" }}>
              {p.category !== "land" && (
                <>
                  <Metric
                    icon="bed"
                    text={`${p.bedrooms ?? "—"} ${t("beds")}`}
                  />
                  <Metric
                    icon="bath"
                    text={`${p.bathrooms ?? "—"} ${t("baths")}`}
                  />
                </>
              )}
              <Metric
                icon="area"
                text={`${p.area.toLocaleString("en-US")} ${t(p.areaUnit)}`}
              />
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: C.line,
                marginTop: 4,
                paddingTop: 14,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Body
                  style={{ fontSize: 19, fontWeight: "600", color: C.green }}
                >
                  {priceLabel(p)}
                </Body>
                {p.transaction === "rent" && (
                  <Body muted style={{ fontSize: 11 }}>
                    {t("month")}
                  </Body>
                )}
              </View>
              <View
                style={{
                  borderRadius: 25,
                  padding: 9,
                  backgroundColor: C.light,
                }}
              >
                <Icon name="arrow" size={18} />
              </View>
            </View>
          </View>
        </Pressable>
      </Link>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          flexDirection: "row",
          gap: 6,
        }}
      >
        <Badge text={t(p.transaction === "sale" ? "forSale" : "forRent")} />
        {p.demo && <Badge text="DEMO" dark />}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ids.has(p.id) ? t("saved") : t("save")}
        accessibilityState={{ selected: ids.has(p.id) }}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            await toggle(p.id);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          backgroundColor: C.white,
          padding: 9,
          borderRadius: 25,
        }}
      >
        <Icon name="heart" size={19} filled={ids.has(p.id)} color={C.green} />
      </Pressable>
      {error ? <Notice message={error} error /> : null}
    </View>
  );
}
export function Badge({
  text,
  dark = false,
}: {
  text: string;
  dark?: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: dark ? C.dark : C.white,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          fontFamily: font,
          fontSize: 11,
          fontWeight: "600",
          color: dark ? C.white : C.green,
          lineHeight: 19,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
function Metric({
  icon,
  text,
}: {
  icon: "bed" | "bath" | "area";
  text: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
      <Icon name={icon} size={15} color={C.muted} />
      <Body muted style={{ fontSize: 11 }}>
        {text}
      </Body>
    </View>
  );
}
export function PropertyGrid({ items }: { items: Listing[] }) {
  const { width } = useViewport();
  const columns = width >= 1080 ? 3 : width >= 650 ? 2 : 1;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
      {items.map((p) => (
        <View
          key={p.id}
          style={{
            width: columns === 3 ? "31.95%" : columns === 2 ? "48%" : "100%",
          }}
        >
          <PropertyCard listing={p} />
        </View>
      ))}
    </View>
  );
}
