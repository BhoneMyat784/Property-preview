import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { router } from "expo-router";
import { api, photoUrl } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import {
  categories,
  listingInput,
  type Listing,
  type Locations,
  type ListingInput,
} from "../shared/contracts";
import {
  Body,
  Button,
  C,
  Field,
  Heading,
  Loading,
  Notice,
  Page,
  Panel,
  useWide,
} from "./ui";
import Select from "./Select";
import Upload from "./Upload";
const defaults = {
  title: "",
  description: "",
  transaction: "sale",
  category: "house",
  cityId: "",
  townshipId: "",
  address: "",
  currency: "MMK",
  price: "",
  area: "",
  areaUnit: "sqft",
  bedrooms: "",
  bathrooms: "",
  phone: "",
  viber: "",
};
export default function ListingEditor({ id }: { id?: string }) {
  const { t, locale } = useLanguage();
  const wide = useWide();
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [listing, setListing] = useState<Listing | null>(null);
  const [locations, setLocations] = useState<Locations>({
    cities: [],
    townships: [],
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api<Locations>("/locations"),
      id ? api<Listing>(`/seller/listings/${id}`) : Promise.resolve(null),
    ])
      .then(([loc, p]) => {
        if (!active) return;
        setLocations(loc);
        setListing(p);
        if (p)
          setValues(
            Object.fromEntries(
              Object.keys(defaults).map((k) => [
                k,
                String(p[k as keyof Listing] ?? ""),
              ]),
            ),
          );
        else setValues(defaults);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  function update(k: string, v: string) {
    setValues((previous) => ({
      ...previous,
      [k]: v,
      ...(k === "cityId" ? { townshipId: "" } : {}),
      ...(k === "category"
        ? { bedrooms: "", bathrooms: "", areaUnit: "sqft" }
        : {}),
    }));
  }
  async function save() {
    setError("");
    setMessage("");
    const input = {
      ...values,
      price: Number(values.price),
      area: Number(values.area),
      bedrooms:
        values.category === "land" || values.bedrooms === ""
          ? null
          : Number(values.bedrooms),
      bathrooms:
        values.category === "land" || values.bathrooms === ""
          ? null
          : Number(values.bathrooms),
    };
    const parsed = listingInput.safeParse(input);
    if (!parsed.success) {
      setError(
        `${t("requiredFields")} ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
      return;
    }
    setBusy(true);
    try {
      const p = await api<Listing>(`/seller/listings${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(parsed.data),
      });
      setListing(p);
      setMessage(t("savedChanges"));
      if (!id)
        router.replace({
          pathname: "/dashboard/listings/[id]",
          params: { id: p.id },
        });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function photoAction(action: () => Promise<unknown>) {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      await action();
      setListing(await api<Listing>(`/seller/listings/${id}`));
      setMessage(t("savedChanges"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error && !locations.cities.length)
    return (
      <Page>
        <Notice message={error} error />
        <Button href="/dashboard">{t("dashboard")}</Button>
      </Page>
    );
  const name = (l: Locations["cities"][number]) =>
    locale === "my" ? l.nameMy : l.nameEn;
  const locationOptions = (type: "cities" | "townships") => {
    const opts = locations[type]
      .filter((l) => type === "cities" || l.cityId === values.cityId)
      .map((l) => ({ value: l.id, label: name(l) }));
    const current = values[type === "cities" ? "cityId" : "townshipId"];
    if (current && !opts.some((o) => o.value === current) && listing)
      opts.push({
        value: current,
        label:
          type === "cities"
            ? locale === "my"
              ? listing.cityNameMy
              : listing.cityNameEn
            : locale === "my"
              ? listing.townshipNameMy
              : listing.townshipNameEn,
      });
    return [
      { value: "", label: t(type === "cities" ? "allCities" : "allTownships") },
      ...opts,
    ];
  };
  return (
    <Page style={{ maxWidth: 950 }}>
      <Button variant="ghost" href="/dashboard">
        ← {t("dashboard")}
      </Button>
      <Heading>{t(id ? "editListing" : "createListing")}</Heading>
      <Notice message={t("reviewNote")} />
      <Notice message={message} />
      <Notice message={error} error />
      {listing?.status === "archived" ? (
        <Notice message={t("archived")} />
      ) : (
        <>
          <Panel>
            <Heading size={20}>{t("details")}</Heading>
            <Field
              label={t("title")}
              value={values.title}
              onChangeText={(v) => update("title", v)}
            />
            <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
              <Select
                id="listing-transaction"
                label={t("transaction")}
                value={values.transaction}
                onChange={(v) => update("transaction", v)}
                options={[
                  { value: "sale", label: t("sale") },
                  { value: "rent", label: t("rent") },
                ]}
              />
              <Select
                id="listing-category"
                label={t("category")}
                value={values.category}
                onChange={(v) => update("category", v)}
                options={categories.map((c) => ({ value: c, label: t(c) }))}
              />
            </View>
            <Field
              label={t("description")}
              value={values.description}
              onChangeText={(v) => update("description", v)}
              multiline
            />
            <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
              <Select
                id="listing-city"
                label={t("city")}
                value={values.cityId}
                onChange={(v) => update("cityId", v)}
                options={locationOptions("cities")}
              />
              <Select
                id="listing-township"
                label={t("township")}
                value={values.townshipId}
                onChange={(v) => update("townshipId", v)}
                disabled={!values.cityId}
                options={locationOptions("townships")}
              />
            </View>
            <Field
              label={t("address")}
              value={values.address}
              onChangeText={(v) => update("address", v)}
            />
            <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
              <Select
                id="listing-currency"
                label={t("currency")}
                value={values.currency}
                onChange={(v) => update("currency", v)}
                options={[
                  { value: "MMK", label: "MMK" },
                  { value: "USD", label: "USD" },
                ]}
              />
              <Field
                label={`${t("price")}${values.transaction === "rent" ? ` ${t("month")}` : ""}`}
                value={values.price}
                onChangeText={(v) => update("price", v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
              <Field
                label={t("area")}
                value={values.area}
                onChangeText={(v) => update("area", v)}
                keyboardType="numeric"
              />
              <Select
                id="listing-area-unit"
                label={t("areaUnit")}
                value={values.areaUnit}
                onChange={(v) => update("areaUnit", v)}
                options={[
                  { value: "sqft", label: t("sqft") },
                  ...(values.category === "land"
                    ? [{ value: "acre", label: t("acre") }]
                    : []),
                ]}
              />
              {values.category !== "land" && (
                <>
                  <Field
                    label={t("bedrooms")}
                    value={values.bedrooms}
                    onChangeText={(v) => update("bedrooms", v)}
                    keyboardType="numeric"
                  />
                  <Field
                    label={t("bathrooms")}
                    value={values.bathrooms}
                    onChangeText={(v) => update("bathrooms", v)}
                    keyboardType="numeric"
                  />
                </>
              )}
            </View>
            <Field
              label={t("phone")}
              value={values.phone}
              onChangeText={(v) => update("phone", v)}
              keyboardType="phone-pad"
            />
            <Field
              label={t("viberNumber")}
              value={values.viber}
              onChangeText={(v) => update("viber", v)}
              keyboardType="phone-pad"
            />
            <Button busy={busy} onPress={() => void save()}>
              {t(id ? "saveChanges" : "saveDraft")}
            </Button>
          </Panel>
          {id && (
            <Panel>
              <Heading size={20}>{t("photos")}</Heading>
              <Body muted>{t("photoHint")}</Body>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                {listing?.photos.map((p, i) => (
                  <View key={p.id} style={{ gap: 7, width: 160 }}>
                    <Image
                      source={{ uri: photoUrl(p.url) }}
                      style={{
                        height: 120,
                        width: 160,
                        borderRadius: 9,
                        backgroundColor: C.line,
                      }}
                    />
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      <Button
                        small
                        variant="ghost"
                        label={t("moveLeft")}
                        disabled={busy || i === 0}
                        onPress={() =>
                          void photoAction(async () => {
                            const ids = listing.photos.map((photo) => photo.id);
                            [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                            return api(`/seller/listings/${id}/photos/order`, {
                              method: "PUT",
                              body: JSON.stringify({ ids }),
                            });
                          })
                        }
                      >
                        ←
                      </Button>
                      <Button
                        small
                        variant="ghost"
                        label={t("moveRight")}
                        disabled={busy || i === listing.photos.length - 1}
                        onPress={() =>
                          void photoAction(async () => {
                            const ids = listing.photos.map((photo) => photo.id);
                            [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                            return api(`/seller/listings/${id}/photos/order`, {
                              method: "PUT",
                              body: JSON.stringify({ ids }),
                            });
                          })
                        }
                      >
                        →
                      </Button>
                      <Button
                        small
                        variant="danger"
                        disabled={busy}
                        onPress={() =>
                          void photoAction(() =>
                            api(`/seller/listings/${id}/photos/${p.id}`, {
                              method: "DELETE",
                            }),
                          )
                        }
                      >
                        {t("remove")}
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
              <Upload
                disabled={busy}
                onUpload={(form) =>
                  photoAction(() =>
                    api(`/seller/listings/${id}/photos`, {
                      method: "POST",
                      body: form,
                    }),
                  )
                }
              />
              {listing && ["draft", "rejected"].includes(listing.status) && (
                <Button
                  busy={busy}
                  onPress={() =>
                    void photoAction(async () => {
                      await api(`/seller/listings/${id}/submit`, {
                        method: "POST",
                        body: "{}",
                      });
                      router.replace("/dashboard");
                    })
                  }
                >
                  {t("submit")}
                </Button>
              )}
              {listing?.rejectionReason ? (
                <Notice message={listing.rejectionReason} error />
              ) : null}
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}
