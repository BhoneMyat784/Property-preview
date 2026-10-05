import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link, usePathname } from "expo-router";
import { useLanguage } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Body, Button, C, font, useWide } from "./ui";
import { Icon } from "./Icon";
export function Header() {
  const { t, locale, setLocale } = useLanguage();
  const { user, logout } = useAuth();
  const wide = useWide();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <View
      style={{
        backgroundColor: C.white,
        borderBottomWidth: 1,
        borderBottomColor: C.line,
        zIndex: 50,
      }}
    >
      <View
        style={{
          maxWidth: 1240,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: 24,
          minHeight: 86,
          flexDirection: "row",
          alignItems: "center",
          gap: wide ? 14 : 12,
        }}
      >
        <Link href="/" asChild>
          <Pressable
            accessibilityLabel="Property Portal home"
            style={{ flexDirection: "row", alignItems: "center", gap: 11 }}
          >
            <View
              style={{
                padding: 10,
                borderRadius: 11,
                backgroundColor: C.green,
              }}
            >
              <Icon name="home" size={23} color="white" />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: font,
                  fontSize: 19,
                  fontWeight: "600",
                  color: C.ink,
                  letterSpacing: -0.5,
                }}
              >
                Property Portal
              </Text>
              {wide && (
                <Text
                  style={{
                    fontFamily: font,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: C.muted,
                    marginTop: 4,
                  }}
                >
                  FIND YOUR NEXT CHAPTER
                </Text>
              )}
            </View>
          </Pressable>
        </Link>
        <View style={{ flex: 1 }} />
        {wide && (
          <>
            <Button variant="ghost" href="/properties?transaction=sale">
              {t("buy")}
            </Button>
            <Button variant="ghost" href="/properties?transaction=rent">
              {t("rent")}
            </Button>
            <Button
              variant="ghost"
              href="/favorites"
              icon="heart"
              label={t("favorites")}
            >
              {""}
            </Button>
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locale === "my" ? "Switch to English" : "မြန်မာဘာသာသို့ပြောင်းရန်"
          }
          onPress={() => setLocale(locale === "my" ? "en" : "my")}
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontFamily: font, color: C.green, fontSize: 12 }}>
            {locale === "my" ? "EN" : "မြန်မာ"}
          </Text>
        </Pressable>
        {wide ? (
          <>
            <Button variant="ghost" href={user ? "/dashboard" : "/auth"}>
              {user ? t("account") : t("signIn")}
            </Button>
            {user?.role === "admin" && (
              <Button variant="ghost" href="/admin">
                {t("admin")}
              </Button>
            )}
            <Button href="/dashboard/listings/new" icon="plus">
              {t("post")}
            </Button>
            {user && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("signOut")}
                onPress={() => void logout()}
              >
                <Icon name="close" size={17} color={C.muted} />
              </Pressable>
            )}
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={() => setOpen(!open)}
            style={{ padding: 8 }}
          >
            <Icon name="menu" />
          </Pressable>
        )}
      </View>
      {!wide && open && (
        <View style={{ padding: 20, gap: 8 }}>
          {[
            ["buy", "/properties?transaction=sale"],
            ["rent", "/properties?transaction=rent"],
            ["favorites", "/favorites"],
            [user ? "dashboard" : "signIn", user ? "/dashboard" : "/auth"],
            ["sell", "/dashboard/listings/new"],
            ...(user?.role === "admin" ? [["admin", "/admin"]] : []),
          ].map(([key, href]) => (
            <Button
              key={key}
              variant="secondary"
              href={href as any}
              onPress={() => setOpen(false)}
            >
              {t(key as any)}
            </Button>
          ))}
          {user && (
            <Button variant="ghost" onPress={() => void logout()}>
              {t("signOut")}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
export function Footer() {
  const { t } = useLanguage();
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: C.line,
        backgroundColor: C.white,
        marginTop: 30,
      }}
    >
      <View
        style={{
          maxWidth: 1240,
          width: "100%",
          alignSelf: "center",
          padding: 28,
          gap: 15,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <View style={{ gap: 4 }}>
            <Body style={{ fontSize: 17, fontWeight: "600" }}>
              Property Portal
            </Body>
            <Body muted style={{ fontSize: 12 }}>
              {t("footerText")}
            </Body>
          </View>
          <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap" }}>
            <Button small variant="ghost" href="/properties?transaction=sale">
              {t("buy")}
            </Button>
            <Button small variant="ghost" href="/properties?transaction=rent">
              {t("rent")}
            </Button>
            <Button small variant="ghost" href="/dashboard/listings/new">
              {t("sell")}
            </Button>
          </View>
        </View>
        <View
          style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 16 }}
        >
          <Body muted style={{ fontSize: 11 }}>
            {t("demoNotice")}
          </Body>
          <Body muted style={{ fontSize: 10 }}>
            © 2026 Property Portal
          </Body>
        </View>
      </View>
    </View>
  );
}
