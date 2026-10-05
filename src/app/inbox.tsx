import React from "react";
import { Linking, View } from "react-native";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import {
  Body,
  Button,
  Empty,
  Heading,
  Loading,
  Notice,
  Page,
  Panel,
} from "../components/ui";
export default function Inbox() {
  const { t } = useLanguage();
  const { data, error, loading, refresh } =
    useResource<
      { to: string; subject: string; url: string; createdAt: number }[]
    >("/dev/inbox");
  return (
    <Page>
      <Heading>{t("inbox")}</Heading>
      <Body muted>{t("inboxSub")}</Body>
      <Button variant="secondary" onPress={() => void refresh()}>
        {t("retry")}
      </Button>
      {error ? <Notice message={error} error /> : null}
      {loading && !data ? (
        <Loading />
      ) : data?.length ? (
        data.map((m) => (
          <Panel key={m.url}>
            <Heading size={18}>{m.subject}</Heading>
            <Body>{m.to}</Body>
            <Body muted>{new Date(m.createdAt).toLocaleString()}</Body>
            <Button onPress={() => void Linking.openURL(m.url)}>
              {t("openEmail")}
            </Button>
          </Panel>
        ))
      ) : (
        <Empty title={t("noMail")} />
      )}
    </Page>
  );
}
