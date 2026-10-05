import React from "react";
import { View } from "react-native";
import { useLoaderData, useLocalSearchParams, router } from "expo-router";
import type {
  LoaderFunction,
  GenerateMetadataFunction,
} from "expo-router/server";
import { publicData, type HomeData } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useLanguage } from "../../lib/i18n";
import {
  Body,
  Button,
  C,
  Empty,
  Heading,
  Loading,
  Notice,
  Page,
  Panel,
  useWide,
} from "../../components/ui";
import { PropertyGrid } from "../../components/PropertyCard";
import SearchForm from "../../components/SearchForm";
export const loader: LoaderFunction<HomeData> = async (request) => {
  const query = request ? new URL(request.url).search : "";
  const [listings, locations] = await Promise.all([
    publicData<HomeData["listings"]>(`/listings${query}`),
    publicData<HomeData["locations"]>("/locations"),
  ]);
  return { listings, locations };
};
export const generateMetadata: GenerateMetadataFunction = () => ({
  title: "Find properties | Property Portal",
  description:
    "Search houses, apartments and land for sale or rent in Yangon and Mandalay.",
});
export default function Properties() {
  const initial = useLoaderData<typeof loader>();
  const raw = useLocalSearchParams<Record<string, string>>();
  const params = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, String(v)]),
  );
  const query = new URLSearchParams(params).toString();
  const { data, error, loading, refresh } = useResource<HomeData["listings"]>(
    `/listings?${query}`,
    initial.listings,
  );
  const { t } = useLanguage();
  const wide = useWide();
  const page = data?.page || 1;
  const pages = Math.max(
    1,
    Math.ceil((data?.total || 0) / (data?.pageSize || 12)),
  );
  return (
    <Page>
      <View style={{ gap: 7 }}>
        <Body muted>
          {t("home")} / {t(params.transaction === "rent" ? "rent" : "buy")}
        </Body>
        <Heading>
          {t(params.transaction === "rent" ? "forRent" : "forSale")}
        </Heading>
        <Body muted>
          {data?.total || 0} {t("results")}
        </Body>
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        <Panel style={{ width: wide ? 280 : "100%", padding: 20 }}>
          <Heading size={18}>{t("filters")}</Heading>
          <SearchForm locations={initial.locations} initial={params} />
        </Panel>
        <View style={{ flex: 1, width: wide ? undefined : "100%", gap: 24 }}>
          {error ? (
            <>
              <Notice message={error} error />
              <Button onPress={() => void refresh()}>{t("retry")}</Button>
            </>
          ) : loading && !data ? (
            <Loading />
          ) : data?.items.length ? (
            <PropertyGrid items={data.items} />
          ) : (
            <Empty title={t("empty")} description={t("emptySub")} />
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Button
              small
              variant="secondary"
              disabled={page <= 1}
              onPress={() =>
                router.push({
                  pathname: "/properties",
                  params: { ...params, page: String(page - 1) },
                })
              }
            >
              {t("previous")}
            </Button>
            <Body muted>
              {t("page")} {page} / {pages}
            </Body>
            <Button
              small
              variant="secondary"
              disabled={page >= pages}
              onPress={() =>
                router.push({
                  pathname: "/properties",
                  params: { ...params, page: String(page + 1) },
                })
              }
            >
              {t("next")}
            </Button>
          </View>
        </View>
      </View>
    </Page>
  );
}
