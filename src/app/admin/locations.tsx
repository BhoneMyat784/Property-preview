import React, { useState } from "react";
import { View } from "react-native";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { useLanguage } from "../../lib/i18n";
import type { Locations, Location } from "../../shared/contracts";
import {
  Body,
  Button,
  C,
  Field,
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
  const { t } = useLanguage();
  const wide = useWide();
  const { data, error, loading, refresh } = useResource<Locations>(
    "/locations?includeInactive=true",
  );
  const [type, setType] = useState<"cities" | "townships">("cities");
  const [editing, setEditing] = useState<Location | null>(null);
  const [nameEn, setEn] = useState("");
  const [nameMy, setMy] = useState("");
  const [cityId, setCityId] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function clear() {
    setEditing(null);
    setEn("");
    setMy("");
    setCityId("");
  }
  async function change(operation: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await operation();
      await refresh();
      setMessage(t("savedChanges"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    await change(() =>
      api(`/admin/${type}${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          nameEn,
          nameMy,
          cityId: type === "townships" ? cityId : undefined,
          active: editing?.active ?? true,
        }),
      }),
    );
  }
  return (
    <Page>
      <Button variant="ghost" href="/admin">
        ← {t("admin")}
      </Button>
      <Heading>{t("manageLocations")}</Heading>
      <Notice message={actionError || error} error />
      <Notice message={message} />
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 26,
          alignItems: "flex-start",
        }}
      >
        <Panel style={{ width: wide ? 330 : "100%" }}>
          <Select
            id="location-type"
            label={t("category")}
            value={type}
            onChange={(v) => {
              setType(v as typeof type);
              clear();
            }}
            options={[
              { value: "cities", label: t("city") },
              { value: "townships", label: t("township") },
            ]}
          />
          {type === "townships" && (
            <Select
              id="location-city"
              label={t("city")}
              value={cityId}
              onChange={setCityId}
              disabled={!!editing}
              options={[
                { value: "", label: t("allCities") },
                ...(data?.cities || []).map((c) => ({
                  value: c.id,
                  label: c.nameEn,
                })),
              ]}
            />
          )}
          <Field label={t("nameEn")} value={nameEn} onChangeText={setEn} />
          <Field label={t("nameMy")} value={nameMy} onChangeText={setMy} />
          <Button busy={busy} onPress={() => void save()}>
            {t(
              editing
                ? "saveChanges"
                : type === "cities"
                  ? "addCity"
                  : "addTownship",
            )}
          </Button>
          {editing && (
            <Button variant="ghost" onPress={clear}>
              {t("cancel")}
            </Button>
          )}
        </Panel>
        <View style={{ flex: 1, width: wide ? undefined : "100%", gap: 12 }}>
          {loading && !data ? (
            <Loading />
          ) : (
            data?.[type].map((l) => (
              <Panel key={l.id} style={{ padding: 18, gap: 10 }}>
                <View>
                  <Heading size={17}>
                    {l.nameEn} / {l.nameMy}
                  </Heading>
                  <Body muted>
                    {l.cityId
                      ? `${data.cities.find((c) => c.id === l.cityId)?.nameEn} · `
                      : ""}
                    {t(l.active ? "active" : "inactive")}
                  </Body>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                >
                  <Button
                    small
                    variant="secondary"
                    onPress={() => {
                      setEditing(l);
                      setEn(l.nameEn);
                      setMy(l.nameMy);
                      setCityId(l.cityId || "");
                    }}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    disabled={busy}
                    onPress={() =>
                      void change(() =>
                        api(`/admin/${type}/${l.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ ...l, active: !l.active }),
                        }),
                      )
                    }
                  >
                    {t(l.active ? "deactivate" : "activate")}
                  </Button>
                  <Button
                    small
                    variant="danger"
                    disabled={busy}
                    onPress={() =>
                      void change(() =>
                        api(`/admin/${type}/${l.id}`, { method: "DELETE" }),
                      )
                    }
                  >
                    {t("deleteLocation")}
                  </Button>
                </View>
              </Panel>
            ))
          )}
        </View>
      </View>
    </Page>
  );
}
export default function ManageLocations() {
  return (
    <Gate admin>
      <Content />
    </Gate>
  );
}
