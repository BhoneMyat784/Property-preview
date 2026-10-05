import React, { useState } from "react";
import { Image, View } from "react-native";
import { api, photoUrl } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useLanguage } from "../../lib/i18n";
import { statuses, type Listing } from "../../shared/contracts";
import { Badge, priceLabel } from "../../components/PropertyCard";
import {
  Body,
  Button,
  Empty,
  Field,
  Gate,
  Heading,
  Loading,
  Notice,
  Page,
  Panel,
} from "../../components/ui";
import Select from "../../components/Select";
interface History {
  id: string;
  action: string;
  reason: string | null;
  createdAt: number;
}
function ReviewCard({
  listing: p,
  onChange,
}: {
  listing: Listing;
  onChange: () => Promise<void>;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<History[] | null>(null);
  async function moderate(action: "approve" | "reject" | "remove") {
    setBusy(true);
    setError("");
    try {
      if (action !== "approve" && !reason.trim())
        throw new Error(t("reasonRequired"));
      await api(`/admin/listings/${p.id}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <View>
          <Heading size={22}>{p.title}</Heading>
          <Body muted>
            {p.ownerName} · {t(p.sellerType)} · {p.townshipNameEn},{" "}
            {p.cityNameEn}
          </Body>
        </View>
        <Badge text={t(p.status)} dark={p.status === "published"} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {p.photos.map((photo) => (
          <Image
            key={photo.id}
            source={{ uri: photoUrl(photo.url) }}
            style={{ width: 180, height: 125, borderRadius: 10 }}
          />
        ))}
      </View>
      <Body style={{ fontWeight: "600" }}>
        {priceLabel(p)} {p.transaction === "rent" ? t("month") : ""} ·{" "}
        {t(p.category)} · {p.area} {t(p.areaUnit)}
      </Body>
      <Body>{p.description}</Body>
      <Body muted>
        {p.address} · {p.phone}
        {p.viber ? ` · Viber ${p.viber}` : ""}
      </Body>
      {p.rejectionReason ? <Notice message={p.rejectionReason} error /> : null}
      {p.status !== "archived" && (
        <Field
          label={t("reason")}
          value={reason}
          onChangeText={setReason}
          multiline
        />
      )}
      <Notice message={error} error />
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {p.status === "pending" && (
          <>
            <Button
              busy={busy}
              icon="check"
              onPress={() => void moderate("approve")}
            >
              {t("approve")}
            </Button>
            <Button
              disabled={busy}
              variant="danger"
              onPress={() => void moderate("reject")}
            >
              {t("reject")}
            </Button>
          </>
        )}
        {p.status !== "archived" && (
          <Button
            disabled={busy}
            variant="danger"
            onPress={() => void moderate("remove")}
          >
            {t("removeListing")}
          </Button>
        )}
        <Button
          variant="ghost"
          onPress={async () => {
            try {
              setHistory(
                history
                  ? null
                  : await api<History[]>(`/admin/listings/${p.id}/history`),
              );
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {t("history")}
        </Button>
      </View>
      {history && (
        <View style={{ gap: 10 }}>
          {history.length ? (
            history.map((h) => (
              <Body key={h.id} muted>
                {new Date(h.createdAt).toLocaleString()} · {h.action}
                {h.reason ? ` — ${h.reason}` : ""}
              </Body>
            ))
          ) : (
            <Body muted>{t("noHistory")}</Body>
          )}
        </View>
      )}
    </Panel>
  );
}
function Content() {
  const { t } = useLanguage();
  const [status, setStatus] = useState("pending");
  const { data, error, loading, refresh } = useResource<Listing[]>(
    `/admin/listings?status=${status}`,
  );
  return (
    <Page>
      <Heading>{t("moderation")}</Heading>
      <Body muted>{t("adminSub")}</Body>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <View style={{ width: 260 }}>
          <Select
            id="admin-status"
            label={t("sort")}
            value={status}
            onChange={setStatus}
            options={[
              ...statuses.map((s) => ({ value: s, label: t(s) })),
              { value: "all", label: t("allStatuses") },
            ]}
          />
        </View>
        <Button variant="secondary" href="/admin/locations">
          {t("manageLocations")}
        </Button>
      </View>
      {error ? (
        <>
          <Notice message={error} error />
          <Button onPress={() => void refresh()}>{t("retry")}</Button>
        </>
      ) : null}
      {loading && !data ? (
        <Loading />
      ) : data?.length ? (
        data.map((p) => (
          <ReviewCard key={p.id} listing={p} onChange={refresh} />
        ))
      ) : (
        <Empty title={t("noPending")} description={t("noPendingSub")} />
      )}
    </Page>
  );
}
export default function Admin() {
  return (
    <Gate admin>
      <Content />
    </Gate>
  );
}
