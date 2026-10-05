import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { authRequest } from "../lib/api";
import {
  Body,
  Button,
  C,
  Field,
  Heading,
  Notice,
  Page,
  Panel,
} from "../components/ui";
export default function Auth() {
  const params = useLocalSearchParams<{
    mode?: string;
    token?: string;
    verified?: string;
  }>();
  const { t } = useLanguage();
  const { refresh } = useAuth();
  const [mode, setMode] = useState(params.mode || "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(params.verified ? t("verified") : "");
  const [error, setError] = useState("");
  useEffect(() => {
    setMode(params.mode || "signin");
  }, [params.mode]);
  async function submit() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const callbackURL = `${typeof window !== "undefined" ? window.location.origin : process.env.EXPO_PUBLIC_APP_URL || "http://localhost:8081"}/auth?verified=1`;
      if (mode === "register") {
        await authRequest("sign-up/email", {
          name,
          email: email.trim(),
          password,
          callbackURL,
        });
        setMessage(t("verifyMessage"));
      } else if (mode === "forgot") {
        await authRequest("request-password-reset", {
          email: email.trim(),
          redirectTo: callbackURL.replace("?verified=1", "?mode=reset"),
        });
        setMessage(t("resetMessage"));
      } else if (mode === "reset") {
        await authRequest("reset-password", {
          newPassword: password,
          token: params.token,
        });
        setMode("signin");
        setPassword("");
        setMessage(t("passwordChanged"));
      } else {
        await authRequest("sign-in/email", { email: email.trim(), password });
        await refresh();
        router.replace("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      await authRequest("send-verification-email", {
        email: email.trim(),
        callbackURL: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:8081"}/auth?verified=1`,
      });
      setMessage(t("verificationSent"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "register"
      ? "registerTitle"
      : mode === "forgot" || mode === "reset"
        ? "resetPassword"
        : "welcome";
  return (
    <Page style={{ maxWidth: 540, paddingVertical: 60 }}>
      <View style={{ gap: 9, alignItems: "center" }}>
        <Heading size={29}>{t(title)}</Heading>
        <Body muted style={{ textAlign: "center" }}>
          {t(mode === "register" ? "registerSubtitle" : "authSubtitle")}
        </Body>
      </View>
      <Panel style={{ padding: 30 }}>
        {mode === "register" && (
          <Field
            label={t("name")}
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        )}
        {mode !== "reset" && (
          <Field
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
        {mode !== "forgot" && (
          <Field
            label={t(mode === "reset" ? "newPassword" : "password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            placeholder={mode === "register" ? t("minPassword") : undefined}
            onSubmitEditing={() => void submit()}
          />
        )}
        <Notice message={error} error />
        <Notice message={message} />
        <Button busy={busy} onPress={() => void submit()}>
          {t(
            mode === "register"
              ? "register"
              : mode === "forgot"
                ? "sendReset"
                : mode === "reset"
                  ? "resetPassword"
                  : "signIn",
          )}
        </Button>
        {mode === "signin" && (
          <>
            <Button
              variant="ghost"
              onPress={() => {
                setMode("forgot");
                setError("");
                setMessage("");
              }}
            >
              {t("forgot")}
            </Button>
            {error ? (
              <Button
                variant="secondary"
                busy={busy}
                disabled={!email}
                onPress={() => void resend()}
              >
                {t("resend")}
              </Button>
            ) : null}
          </>
        )}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: C.line,
            paddingTop: 16,
            alignItems: "center",
            gap: 5,
          }}
        >
          <Body muted>
            {t(mode === "signin" ? "noAccount" : "haveAccount")}
          </Body>
          <Button
            variant="ghost"
            onPress={() => {
              setMode(mode === "signin" ? "register" : "signin");
              setError("");
              setMessage("");
            }}
          >
            {t(mode === "signin" ? "register" : "signIn")}
          </Button>
        </View>
      </Panel>
      {process.env.NODE_ENV !== "production" && (
        <Button small variant="ghost" href="/inbox">
          {t("inbox")}
        </Button>
      )}
    </Page>
  );
}
