import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { syncGeofence } from "./src/lib/geofence";
import { ensureNotificationSetup } from "./src/lib/notifications";
import { loadSettings } from "./src/lib/settings";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import type { Settings } from "./src/types";
import { colors } from "./src/theme";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [screen, setScreen] = useState<"home" | "settings">("home");

  useEffect(() => {
    void (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);

      // 설정이 아직 비어 있으면 곧장 설정 화면으로 — 첫 실행에서 빈 홈을 보여줄 이유가 없다.
      if (!loaded.serviceKey || loaded.watches.length === 0) {
        setScreen("settings");
        return;
      }
      await ensureNotificationSetup();
      await syncGeofence();
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {!settings ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.textDim} />
          </View>
        ) : screen === "settings" ? (
          <SettingsScreen
            settings={settings}
            onChange={setSettings}
            onClose={() => setScreen("home")}
          />
        ) : (
          <HomeScreen settings={settings} onOpenSettings={() => setScreen("settings")} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
