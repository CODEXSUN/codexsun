import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"

import { MobileHomeScreen } from "@mobile/screens/mobile-home-screen"

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MobileHomeScreen />
    </SafeAreaProvider>
  )
}
