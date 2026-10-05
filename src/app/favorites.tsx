import React from "react";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import { useFavorites } from "../lib/favorites";
import type { Listing } from "../shared/contracts";
import { PropertyGrid } from "../components/PropertyCard";
import {
  Body,
  Button,
  Empty,
  Gate,
  Heading,
  Loading,
  Notice,
  Page,
} from "../components/ui";
function Content() {
  const { t } = useLanguage();
  const { data, error, loading, refresh } =
    useResource<Listing[]>("/favorites");
  const { ids } = useFavorites();
  const items = data?.filter((p) => ids.has(p.id)) || [];
  return (
    <Page>
      <Heading>{t("savedTitle")}</Heading>
      <Body muted>{t("savedSub")}</Body>
      {error ? (
        <>
          <Notice message={error} error />
          <Button onPress={() => void refresh()}>{t("retry")}</Button>
        </>
      ) : loading && !data ? (
        <Loading />
      ) : items.length ? (
        <PropertyGrid items={items} />
      ) : (
        <Empty
          title={t("noFavorites")}
          description={t("noFavoritesSub")}
          action={<Button href="/properties">{t("search")}</Button>}
        />
      )}
    </Page>
  );
}
export default function Favorites() {
  return (
    <Gate>
      <Content />
    </Gate>
  );
}
