import React from "react";
import { useLanguage } from "../lib/i18n";
import { Page, Empty, Button } from "../components/ui";
export default function NotFound() {
  const { t } = useLanguage();
  return (
    <Page>
      <Empty
        title={t("notFound")}
        action={<Button href="/">{t("home")}</Button>}
      />
    </Page>
  );
}
