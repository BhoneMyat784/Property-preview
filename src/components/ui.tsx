import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ViewStyle,
  type StyleProp,
  type TextInputProps,
} from "react-native";
import { Link, type Href } from "expo-router";
import { useLanguage } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Icon, type IconName } from "./Icon";
export const C = {
  green: "#1c5945",
  dark: "#183c32",
  ink: "#172f28",
  muted: "#6d7d75",
  line: "#e2e8e2",
  cream: "#f7f8f3",
  light: "#edf4ee",
  white: "#fff",
  red: "#a43636",
};
export const font = "Portal";
export function Page({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.page, style]}>{children}</View>;
}
export function Heading({
  children,
  size = 32,
  light = false,
}: {
  children: React.ReactNode;
  size?: number;
  light?: boolean;
}) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: "600",
        lineHeight: size * 1.5,
        color: light ? C.white : C.ink,
        letterSpacing: -0.6,
      }}
    >
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: object;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font,
          fontSize: 14,
          lineHeight: 25,
          color: muted ? C.muted : C.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  href,
  variant = "primary",
  icon,
  disabled = false,
  busy = false,
  small = false,
  label,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  label?: string;
}) {
  const color =
    variant === "primary" ? C.white : variant === "danger" ? C.red : C.green;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const node = (
    <Pressable
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        minHeight: small ? 36 : 46,
        paddingHorizontal: small ? 12 : 20,
        paddingVertical: small ? 6 : 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor:
          variant === "primary"
            ? C.green
            : variant === "secondary"
              ? C.light
              : variant === "danger"
                ? "#fceeee"
                : "transparent",
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: C.line,
        opacity: disabled || busy ? 0.5 : pressed ? 0.75 : hovered ? 0.85 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : icon ? (
        <Icon name={icon} size={18} color={color} />
      ) : null}
      <Text
        style={{
          fontFamily: font,
          fontSize: small ? 12 : 14,
          fontWeight: "600",
          color,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {node}
    </Link>
  ) : (
    node
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  ...props
}: TextInputProps & {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ gap: 7, flexGrow: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor="#99a59f"
        style={[
          styles.input,
          multiline ? { height: 150, textAlignVertical: "top" } : {},
        ]}
        {...props}
      />
    </View>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          padding: 24,
          borderRadius: 16,
          backgroundColor: C.white,
          borderWidth: 1,
          borderColor: C.line,
          gap: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  if (!message) return null;
  return (
    <View
      accessibilityRole={error ? "alert" : "text"}
      style={{
        padding: 14,
        backgroundColor: error ? "#fcf0ef" : C.light,
        borderRadius: 10,
      }}
    >
      <Text
        style={{
          fontFamily: font,
          lineHeight: 24,
          fontSize: 13,
          color: error ? C.red : C.green,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ paddingVertical: 70, alignItems: "center", gap: 14 }}>
      <View style={{ padding: 18, backgroundColor: C.light, borderRadius: 50 }}>
        <Icon name="home" size={28} />
      </View>
      <Heading size={23}>{title}</Heading>
      {description ? (
        <Body muted style={{ textAlign: "center", maxWidth: 500 }}>
          {description}
        </Body>
      ) : null}
      {action}
    </View>
  );
}
export function Loading() {
  const { t } = useLanguage();
  return (
    <View style={{ padding: 60, alignItems: "center", gap: 16 }}>
      <ActivityIndicator color={C.green} />
      <Body muted>{t("loading")}</Body>
    </View>
  );
}
export function Gate({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <Loading />;
  if (!user)
    return (
      <Page>
        <Empty
          title={t("authRequired")}
          description={t("authRequiredSub")}
          action={<Button href="/auth">{t("signIn")}</Button>}
        />
      </Page>
    );
  if (admin && user.role !== "admin")
    return (
      <Page>
        <Empty title={t("error")} description="Admin access required" />
      </Page>
    );
  return <>{children}</>;
}
export function useViewport() {
  const size = useWindowDimensions();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // Match server and first client render; adapt only after hydration.
  return { ...size, width: hydrated ? size.width : 0 };
}
export const useWide = () => useViewport().width >= 1050;
export const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 28,
  },
  label: {
    fontFamily: font,
    fontSize: 12,
    fontWeight: "600",
    color: C.ink,
    lineHeight: 23,
  },
  input: {
    fontFamily: font,
    fontSize: 14,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    minHeight: 46,
    backgroundColor: C.white,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  section: { gap: 20, marginTop: 22 },
});
