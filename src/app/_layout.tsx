import React, { Suspense, useRef, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Slot, usePathname, type ErrorBoundaryProps } from "expo-router";
import { LanguageProvider } from "../lib/i18n";
import { AuthProvider } from "../lib/auth";
import { FavoritesProvider } from "../lib/favorites";
import { Header, Footer } from "../components/Shell";
import { C, Loading, Page, Button, Notice } from "../components/ui";
import WebStyles from "../components/WebStyles";
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <Page>
      <Notice message={error.message} error />
      <Button onPress={retry}>Try again</Button>
    </Page>
  );
}
export default function Layout() {
  const scroll = useRef<ScrollView>(null);
  const pathname = usePathname();
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [pathname]);
  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <WebStyles />
          <View style={{ flex: 1, backgroundColor: C.cream }}>
            <Header />
            <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1 }}>
              <Suspense fallback={<Loading />}>
                <Slot />
              </Suspense>
              <Footer />
            </ScrollView>
          </View>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
