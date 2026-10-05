import React, { useState } from "react";
import { Image, Linking, Pressable, View } from "react-native";
import { useLoaderData, useLocalSearchParams } from "expo-router";
import type {
  LoaderFunction,
  GenerateMetadataFunction,
} from "expo-router/server";
import { ApiError, photoUrl, publicData, type DetailData } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import type { Listing } from "../../shared/contracts";
import { useLanguage } from "../../lib/i18n";
import { useFavorites } from "../../lib/favorites";
import { Badge, priceLabel } from "../../components/PropertyCard";
import {
  Body,
  Button,
  C,
  Empty,
  Heading,
  Notice,
  Page,
  Panel,
  useWide,
} from "../../components/ui";
export const loader: LoaderFunction<DetailData> = async (_request, params) => {
  try {
    return { listing: await publicData<Listing>(`/listings/${params.id}`) };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return { listing: null };
    }
    throw e;
  }
};
export const generateMetadata: GenerateMetadataFunction = async (
  _request,
  params,
) => {
  try {
    const p = await publicData<Listing>(`/listings/${params.id}`);
    return {
      title: `${p.title} | Property Portal`,
      description: `${p.category} for ${p.transaction} in ${p.townshipNameEn}, ${p.cityNameEn}. ${priceLabel(p)}.`,
      openGraph: {
        title: p.title,
        images: p.photos[0] ? [{ url: p.photos[0].url }] : [],
      },
    };
  } catch {
    return {
      title: "Property unavailable | Property Portal",
      robots: "noindex",
    };
  }
};
export default function Detail() {
  const initial = useLoaderData<typeof loader>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: p,
    error,
    refresh,
  } = useResource<Listing>(`/listings/${id}`, initial.listing || undefined);
  const { t, locale } = useLanguage();
  const wide = useWide();
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const { ids, toggle } = useFavorites();
  if (!p)
    return (
      <Page>
        <Empty
          title={t("notFound")}
          description={t("notFoundSub")}
          action={<Button href="/properties">{t("back")}</Button>}
        />
        {error ? (
          <Button variant="ghost" onPress={() => void refresh()}>
            {t("retry")}
          </Button>
        ) : null}
      </Page>
    );
  return (
    <Page>
      <Button variant="ghost" href="/properties">
        ← {t("back")}
      </Button>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Badge
          text={t(p.transaction === "sale" ? "forSale" : "forRent")}
          dark
        />
        {p.demo && <Badge text="DEMO" />}
        <Badge text={t(p.category)} />
      </View>
      <View style={{ gap: 8 }}>
        <Heading size={wide ? 36 : 26}>{p.title}</Heading>
        <Body muted>
          {locale === "my" ? p.townshipNameMy : p.townshipNameEn},{" "}
          {locale === "my" ? p.cityNameMy : p.cityNameEn}
        </Body>
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, width: wide ? undefined : "100%", gap: 24 }}>
          <Image
            source={{
              uri: photoUrl(
                p.photos[Math.min(selected, p.photos.length - 1)]?.url || "",
              ),
            }}
            accessibilityLabel={p.title}
            style={{
              height: wide ? 440 : 270,
              width: "100%",
              backgroundColor: C.line,
              borderRadius: 18,
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {p.photos.map((photo, i) => (
              <Pressable
                key={photo.id}
                accessibilityLabel={`${t("photos")} ${i + 1}`}
                onPress={() => setSelected(i)}
                style={{
                  borderWidth: 2,
                  borderColor: i === selected ? C.green : "transparent",
                  borderRadius: 10,
                  padding: 2,
                }}
              >
                <Image
                  source={{ uri: photoUrl(photo.url) }}
                  style={{ width: 95, height: 70, borderRadius: 7 }}
                />
              </Pressable>
            ))}
          </View>
          <Panel>
            <Heading size={21}>{t("description")}</Heading>
            <Body>{p.description}</Body>
            {p.demo && <Notice message={t("demoNotice")} />}
          </Panel>
          <Panel>
            <Heading size={21}>{t("details")}</Heading>
            {[
              [t("category"), t(p.category)],
              [t("area"), `${p.area} ${t(p.areaUnit)}`],
              ...(p.category !== "land"
                ? [
                    [t("bedrooms"), String(p.bedrooms ?? "—")],
                    [t("bathrooms"), String(p.bathrooms ?? "—")],
                  ]
                : []),
              [t("address"), p.address],
            ].map(([key, value]) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  gap: 20,
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                  paddingBottom: 12,
                }}
              >
                <Body muted>{key}</Body>
                <Body style={{ flex: 1, textAlign: "right" }}>{value}</Body>
              </View>
            ))}
          </Panel>
        </View>
        <Panel style={{ width: wide ? 320 : "100%", gap: 18 }}>
          <Heading size={28}>{priceLabel(p)}</Heading>
          {p.transaction === "rent" && <Body muted>{t("month")}</Body>}
          <Button
            variant="secondary"
            icon="heart"
            onPress={async () => {
              try {
                await toggle(p.id);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            {t(ids.has(p.id) ? "saved" : "save")}
          </Button>
          <View
            style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }}
          />
          <Body muted>{t("contact")}</Body>
          <Heading size={18}>{p.ownerName}</Heading>
          <Body muted>{t(p.sellerType)}</Body>
          <Body style={{ fontSize: 20, fontWeight: "600" }}>{p.phone}</Body>
          <Button
            icon="phone"
            onPress={() =>
              void Linking.openURL(
                `tel:${p.phone.replace(/[ ()-]/g, "")}`,
              ).catch((e) => setMessage(e.message))
            }
          >
            {t("call")}
          </Button>
          {p.viber ? (
            <Button
              variant="secondary"
              onPress={() =>
                void Linking.openURL(
                  `viber://chat?number=${encodeURIComponent(p.viber.replace(/[ ()-]/g, ""))}`,
                ).catch((e) => setMessage(e.message))
              }
            >
              {t("viber")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onPress={async () => {
              try {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  await navigator.clipboard.writeText(p.phone);
                  setMessage(t("copied"));
                } else setMessage(p.phone);
              } catch {
                setMessage(p.phone);
              }
            }}
          >
            {t("copy")}
          </Button>
          <Notice message={message} />
        </Panel>
      </View>
    </Page>
  );
}
