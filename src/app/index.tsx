import React from "react";
import { View, ImageBackground, Pressable, Text } from "react-native";
import { Link, useLoaderData } from "expo-router";
import type {
  LoaderFunction,
  GenerateMetadataFunction,
} from "expo-router/server";
import { publicData, type HomeData } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import {
  Body,
  Button,
  C,
  Heading,
  Page,
  useWide,
  font,
} from "../components/ui";
import { PropertyGrid } from "../components/PropertyCard";
import SearchForm from "../components/SearchForm";
import { Icon } from "../components/Icon";
export const loader: LoaderFunction<HomeData> = async () => {
  const [listings, locations] = await Promise.all([
    publicData<HomeData["listings"]>("/listings"),
    publicData<HomeData["locations"]>("/locations"),
  ]);
  return { listings, locations };
};
export const generateMetadata: GenerateMetadataFunction = () => ({
  title: "Property Portal | Homes, apartments & land in Myanmar",
  description: "Browse properties for sale and rent in Yangon and Mandalay.",
});
export default function Home() {
  const { t } = useLanguage();
  const data = useLoaderData<typeof loader>();
  const wide = useWide();
  return (
    <Page style={{ paddingTop: 24, gap: 36 }}>
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: C.dark,
        }}
      >
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90",
          }}
          style={{
            minHeight: wide ? 570 : 650,
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(7,34,26,0.48)",
            }}
          />
          <View
            style={{
              padding: wide ? 48 : 24,
              paddingTop: wide ? 56 : 34,
              gap: 12,
              maxWidth: 760,
            }}
          >
            <Text
              style={{
                fontFamily: font,
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 2,
                color: "#e1eddd",
                lineHeight: 24,
              }}
            >
              {t("eyebrow")}
            </Text>
            <Heading size={wide ? 54 : 36} light>
              {t("heroTitle")}
            </Heading>
            <Body
              style={{
                color: "#eef4ed",
                fontSize: 15,
                maxWidth: 510,
                lineHeight: 29,
              }}
            >
              {t("heroSubtitle")}
            </Body>
          </View>
          <View
            style={{
              margin: wide ? 32 : 18,
              padding: wide ? 24 : 18,
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: "0px 10px 30px rgba(0,0,0,.08)",
            }}
          >
            <SearchForm compact locations={data.locations} />
          </View>
        </ImageBackground>
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          justifyContent: "space-around",
          gap: 20,
          paddingVertical: 12,
        }}
      >
        {[
          [String(data.listings.total) + "+", t("homes")],
          ["02", t("locations")],
          ["03", t("categories")],
        ].map(([n, text]) => (
          <View
            key={text}
            style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
          >
            <Text
              style={{
                fontFamily: font,
                fontSize: 30,
                fontWeight: "600",
                color: C.green,
              }}
            >
              {n}
            </Text>
            <Body muted style={{ fontSize: 12 }}>
              {text}
            </Body>
          </View>
        ))}
      </View>
      <View style={{ gap: 20 }}>
        <View>
          <Heading size={28}>{t("explore")}</Heading>
          <Body muted>{t("exploreSub")}</Body>
        </View>
        <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
          {(["house", "apartment", "land"] as const).map((category, i) => (
            <Link
              key={category}
              href={{ pathname: "/properties", params: { category } }}
              asChild
            >
              <Pressable
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 24,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.line,
                  backgroundColor: C.white,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 15,
                  }}
                >
                  <View
                    style={{
                      padding: 14,
                      backgroundColor: C.light,
                      borderRadius: 12,
                    }}
                  >
                    <Icon
                      name={
                        category === "house"
                          ? "home"
                          : category === "apartment"
                            ? "building"
                            : "land"
                      }
                      size={25}
                    />
                  </View>
                  <Body style={{ fontSize: 17, fontWeight: "600" }}>
                    {t(category)}
                  </Body>
                </View>
                <Icon name="arrow" size={18} />
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
      <View style={{ gap: 22, marginTop: 8 }}>
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            justifyContent: "space-between",
            gap: 12,
            alignItems: wide ? "center" : "flex-start",
          }}
        >
          <View>
            <Heading size={28}>{t("latest")}</Heading>
            <Body muted>{t("latestSub")}</Body>
          </View>
          <Button variant="ghost" href="/properties" icon="arrow">
            {t("viewAll")}
          </Button>
        </View>
        <PropertyGrid items={data.listings.items.slice(0, 6)} />
      </View>
      <View style={{ gap: 22, marginTop: 14 }}>
        <View>
          <Heading size={28}>{t("cityTitle")}</Heading>
          <Body muted>{t("citySub")}</Body>
        </View>
        <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
          {(["yangon", "mandalay"] as const).map((city, i) => (
            <Link
              key={city}
              href={{ pathname: "/properties", params: { cityId: city } }}
              asChild
            >
              <Pressable
                style={{ flex: 1, borderRadius: 18, overflow: "hidden" }}
              >
                <ImageBackground
                  source={{
                    uri:
                      i === 0
                        ? "https://images.unsplash.com/photo-1559635056-5b41b88e4a4c?auto=format&fit=crop&w=900&q=85"
                        : "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
                  }}
                  style={{
                    height: 255,
                    backgroundColor: C.green,
                    justifyContent: "flex-end",
                    padding: 26,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(9,36,27,.48)",
                    }}
                  />
                  <Heading light size={28}>
                    {t(city)}
                  </Heading>
                  <Body style={{ color: "white", fontSize: 12 }}>
                    {t(city === "yangon" ? "yangonSub" : "mandalaySub")}
                  </Body>
                  <View
                    style={{
                      position: "absolute",
                      right: 26,
                      bottom: 30,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,.4)",
                      borderRadius: 30,
                    }}
                  >
                    <Icon name="arrow" color="white" />
                  </View>
                </ImageBackground>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
      <View
        style={{
          backgroundColor: "#e9f1e8",
          borderRadius: 20,
          padding: wide ? 42 : 25,
          flexDirection: wide ? "row" : "column",
          alignItems: wide ? "center" : "flex-start",
          gap: 24,
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <View style={{ flex: 1, gap: 9 }}>
          <Heading size={26}>{t("ctaTitle")}</Heading>
          <Body muted>{t("ctaSub")}</Body>
        </View>
        <Button href="/dashboard/listings/new" icon="plus">
          {t("ctaButton")}
        </Button>
      </View>
    </Page>
  );
}
