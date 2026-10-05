import React, { useState } from "react";
import { View } from "react-native";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useLanguage } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import type { Listing } from "../../shared/contracts";
import { Badge, priceLabel } from "../../components/PropertyCard";
import {
  Body,
  Button,
  C,
  Empty,
  Gate,
  Heading,
  Loading,
  Notice,
  Page,
  Panel,
  useWide,
} from "../../components/ui";
import Select from "../../components/Select";
function Content() {
  const { t, locale } = useLanguage();
  const { user, refresh: refreshUser } = useAuth();
  const { data, error, loading, refresh } =
    useResource<Listing[]>("/seller/listings");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [sellerType, setSellerType] = useState(user?.sellerType || "owner");
  const wide = useWide();
  async function action(
    p: Listing,
    kind: "submit" | "sold" | "rented" | "withdrawn",
  ) {
    setBusy(p.id);
    setActionError("");
    try {
      await api(
        `/seller/listings/${p.id}/${kind === "submit" ? "submit" : "archive"}`,
        {
          method: "POST",
          body: JSON.stringify(kind === "submit" ? {} : { reason: kind }),
        },
      );
      setMessage(kind === "submit" ? t("submitSuccess") : t("archived"));
      await refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <Page>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          justifyContent: "space-between",
          gap: 18,
          alignItems: wide ? "center" : "flex-start",
        }}
      >
        <View>
          <Heading>{t("myListings")}</Heading>
          <Body muted>{t("myListingsSub")}</Body>
        </View>
        <Button href="/dashboard/listings/new" icon="plus">
          {t("newListing")}
        </Button>
      </View>
      <Notice message={t("reviewNote")} />
      <Notice message={message} />
      <Notice message={actionError || error} error />
      {loading && !data ? (
        <Loading />
      ) : data?.length ? (
        data.map((p) => (
          <Panel key={p.id}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <View style={{ gap: 6 }}>
                <Heading size={20}>{p.title}</Heading>
                <Body muted>
                  {locale === "my" ? p.townshipNameMy : p.townshipNameEn} ·{" "}
                  {priceLabel(p)} {p.transaction === "rent" ? t("month") : ""}
                </Body>
              </View>
              <Badge text={t(p.status)} dark={p.status === "published"} />
            </View>
            {p.rejectionReason ? (
              <Notice message={`${t("reason")}: ${p.rejectionReason}`} error />
            ) : null}
            {p.archiveReason ? (
              <Body muted>
                {t("reason")}: {p.archiveReason}
              </Body>
            ) : null}
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {p.status !== "archived" && (
                <Button
                  small
                  variant="secondary"
                  href={{
                    pathname: "/dashboard/listings/[id]",
                    params: { id: p.id },
                  }}
                >
                  {t("edit")}
                </Button>
              )}
              {["draft", "rejected"].includes(p.status) && (
                <Button
                  small
                  busy={busy === p.id}
                  onPress={() => void action(p, "submit")}
                >
                  {t("submit")}
                </Button>
              )}
              {p.status === "published" && (
                <>
                  <Button
                    small
                    variant="ghost"
                    href={{
                      pathname: "/properties/[id]",
                      params: { id: p.id },
                    }}
                  >
                    {t("details")}
                  </Button>
                  <Button
                    small
                    variant="secondary"
                    disabled={busy === p.id}
                    onPress={() =>
                      void action(
                        p,
                        p.transaction === "sale" ? "sold" : "rented",
                      )
                    }
                  >
                    {t(p.transaction === "sale" ? "sold" : "rented")}
                  </Button>
                </>
              )}
              {p.status !== "archived" && (
                <Button
                  small
                  variant="danger"
                  disabled={busy === p.id}
                  onPress={() => void action(p, "withdrawn")}
                >
                  {t("archive")}
                </Button>
              )}
            </View>
          </Panel>
        ))
      ) : (
        <Empty
          title={t("noListings")}
          description={t("noListingsSub")}
          action={
            <Button href="/dashboard/listings/new">{t("newListing")}</Button>
          }
        />
      )}
      <Panel style={{ maxWidth: 500 }}>
        <Select
          id="dashboard-account-type"
          label={t("accountType")}
          value={sellerType}
          onChange={(v) => setSellerType(v as "owner" | "agent")}
          options={[
            { value: "owner", label: t("owner") },
            { value: "agent", label: t("agent") },
          ]}
        />
        <Button
          variant="secondary"
          onPress={async () => {
            try {
              await api("/profile", {
                method: "PUT",
                body: JSON.stringify({ sellerType }),
              });
              await refreshUser();
              setMessage(t("profileSaved"));
            } catch (e) {
              setActionError((e as Error).message);
            }
          }}
        >
          {t("updateProfile")}
        </Button>
      </Panel>
    </Page>
  );
}
export default function Dashboard() {
  return (
    <Gate>
      <Content />
    </Gate>
  );
}
