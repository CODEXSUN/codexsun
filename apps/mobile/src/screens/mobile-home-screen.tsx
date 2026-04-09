import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import QRCode from "react-native-qrcode-svg"

import {
  clearSavedApiBaseUrl,
  createConnectQrValue,
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  normalizeApiBaseUrl,
  saveApiBaseUrl,
} from "@mobile/config/mobile-config"
import { mobileSharedCatalog } from "@mobile/data/shared-catalog"
import { BackendQrScannerScreen } from "@mobile/screens/backend-qr-scanner-screen"
import {
  fetchBackendHealth,
  type BackendHealthResult,
} from "@mobile/services/backend-health"

const readinessTone = {
  foundation: "#0f766e",
  active: "#166534",
  planned: "#9a3412",
} as const

export function MobileHomeScreen() {
  const [health, setHealth] = useState<BackendHealthResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentApiBaseUrl, setCurrentApiBaseUrl] = useState(getDefaultApiBaseUrl())
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(getDefaultApiBaseUrl())
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)

  useEffect(() => {
    void initializeConnection()
  }, [])

  async function initializeConnection() {
    const resolvedApiBaseUrl = await getApiBaseUrl()
    setCurrentApiBaseUrl(resolvedApiBaseUrl)
    setDraftApiBaseUrl(resolvedApiBaseUrl)
    await checkHealth(resolvedApiBaseUrl)
  }

  async function checkHealth(baseUrl = currentApiBaseUrl) {
    setIsLoading(true)
    const nextHealth = await fetchBackendHealth(baseUrl)
    setHealth(nextHealth)
    setIsLoading(false)
  }

  async function handleResolvedScanner(apiBaseUrl: string) {
    const savedBaseUrl = await saveApiBaseUrl(apiBaseUrl)
    setCurrentApiBaseUrl(savedBaseUrl)
    setDraftApiBaseUrl(savedBaseUrl)
    setScannerOpen(false)
    setScannerMessage(`Connected mobile app to ${savedBaseUrl}`)
    await checkHealth(savedBaseUrl)
  }

  async function handleResetConnection() {
    await clearSavedApiBaseUrl()
    const defaultApiBaseUrl = getDefaultApiBaseUrl()
    setCurrentApiBaseUrl(defaultApiBaseUrl)
    setDraftApiBaseUrl(defaultApiBaseUrl)
    setScannerMessage("Reverted to the default backend URL.")
    await checkHealth(defaultApiBaseUrl)
  }

  async function handleSaveDraftApiBaseUrl() {
    const normalizedApiBaseUrl = normalizeApiBaseUrl(draftApiBaseUrl)

    if (!normalizedApiBaseUrl) {
      setScannerMessage("Enter a valid http or https backend URL.")
      return
    }

    const savedBaseUrl = await saveApiBaseUrl(normalizedApiBaseUrl)
    setCurrentApiBaseUrl(savedBaseUrl)
    setDraftApiBaseUrl(savedBaseUrl)
    setScannerMessage(`Saved backend URL ${savedBaseUrl}`)
    await checkHealth(savedBaseUrl)
  }

  const connectQrValue = createConnectQrValue(currentApiBaseUrl)
  const localhostSelected =
    currentApiBaseUrl.includes("://localhost") || currentApiBaseUrl.includes("://127.0.0.1")

  if (scannerOpen) {
    return (
      <BackendQrScannerScreen
        onCancel={() => setScannerOpen(false)}
        onResolved={(apiBaseUrl) => {
          void handleResolvedScanner(apiBaseUrl)
        }}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{mobileSharedCatalog.hero.eyebrow}</Text>
          <Text style={styles.title}>{mobileSharedCatalog.hero.title}</Text>
          <Text style={styles.summary}>{mobileSharedCatalog.hero.summary}</Text>

          <View style={styles.highlightGrid}>
            {mobileSharedCatalog.hero.highlights.map((item) => (
              <View key={item.id} style={styles.highlightCard}>
                <Text style={styles.highlightLabel}>{item.label}</Text>
                <Text style={styles.highlightSummary}>{item.summary}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Backend connection</Text>
          <Text style={styles.panelCopy}>
            Scan a QR code from your laptop or admin page to point this phone at the correct backend.
          </Text>

          <View style={styles.connectionCard}>
            <Text style={styles.connectionLabel}>Active backend</Text>
            <Text style={styles.connectionValue}>{currentApiBaseUrl}</Text>
          </View>

          {localhostSelected ? (
            <Text style={styles.warningText}>
              `localhost` will not work from Expo Go on your phone. Use your laptop LAN IP instead, for example
              `http://192.168.1.20:3000`.
            </Text>
          ) : null}

          <View style={styles.editorCard}>
            <Text style={styles.connectionLabel}>Backend URL for QR</Text>
            <TextInput
              value={draftApiBaseUrl}
              onChangeText={setDraftApiBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.20:3000"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraftApiBaseUrl()}>
              <Text style={styles.secondaryButtonText}>Save backend URL</Text>
            </Pressable>
          </View>

          {scannerMessage ? <Text style={styles.connectionMessage}>{scannerMessage}</Text> : null}

          <View style={styles.actionStack}>
            {Platform.OS !== "web" ? (
              <Pressable style={styles.primaryButton} onPress={() => setScannerOpen(true)}>
                <Text style={styles.primaryButtonText}>Scan backend QR</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.secondaryButton} onPress={() => void checkHealth()}>
              <Text style={styles.secondaryButtonText}>Check connection</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => void handleResetConnection()}>
              <Text style={styles.ghostButtonText}>Use default backend</Text>
            </Pressable>
          </View>

          <Text style={styles.tipText}>
            QR value can be a direct URL like `http://192.168.1.20:3000` or a connect URL like
            `codexsun-mobile://connect?apiBaseUrl=http%3A%2F%2F192.168.1.20%3A3000`
          </Text>

          <View style={styles.qrCard}>
            <Text style={styles.panelTitle}>Connect QR</Text>
            <Text style={styles.panelCopy}>
              Open this page in the browser, set the backend LAN URL, then scan this QR from Expo Go on Android.
            </Text>
            <View style={styles.qrWrap}>
              <QRCode value={connectQrValue} size={220} />
            </View>
            <Text style={styles.qrValue}>{connectQrValue}</Text>
          </View>

          <View style={styles.healthCard}>
            {isLoading ? (
              <View style={styles.healthLoading}>
                <ActivityIndicator color="#17324d" />
                <Text style={styles.healthLoadingText}>Checking backend health...</Text>
              </View>
            ) : health ? (
              <>
                <Text style={styles.healthStatus}>
                  {health.ok ? "Connected" : "Connection failed"}
                </Text>
                <Text style={styles.healthMeta}>Endpoint: {health.url}</Text>
                <Text style={styles.healthMeta}>
                  Status: {health.status === null ? "unreachable" : health.status}
                </Text>
                <Text style={styles.healthBody}>{health.body}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Shared modules from repo</Text>
          <Text style={styles.panelCopy}>
            These cards are driven by `apps/core/shared/domain/module-registry.ts`.
          </Text>
          {mobileSharedCatalog.modules.slice(0, 6).map((module) => (
            <View key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleName}>{module.name}</Text>
                <View
                  style={[
                    styles.readinessPill,
                    { backgroundColor: readinessTone[module.readiness] },
                  ]}
                >
                  <Text style={styles.readinessText}>{module.readiness}</Text>
                </View>
              </View>
              <Text style={styles.moduleSummary}>{module.summary}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Design defaults reused</Text>
          <Text style={styles.panelCopy}>
            Pulled from `apps/ui/src/design-system/data/project-defaults.ts`.
          </Text>
          {Object.entries(mobileSharedCatalog.defaults).map(([key, value]) => (
            <View key={key} style={styles.defaultRow}>
              <Text style={styles.defaultName}>{key}</Text>
              <Text style={styles.defaultValue}>
                {value.applicationName} • {value.defaultExampleId}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5efe6",
  },
  content: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#17324d",
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: "#f3b562",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8f4ed",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  summary: {
    color: "#d8e1ea",
    fontSize: 15,
    lineHeight: 22,
  },
  highlightGrid: {
    gap: 10,
    marginTop: 8,
  },
  highlightCard: {
    backgroundColor: "#24486b",
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  highlightLabel: {
    color: "#f8f4ed",
    fontSize: 15,
    fontWeight: "700",
  },
  highlightSummary: {
    color: "#d8e1ea",
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: "#fffaf3",
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  panelTitle: {
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "800",
  },
  panelCopy: {
    color: "#5b6470",
    fontSize: 14,
    lineHeight: 20,
  },
  connectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  connectionLabel: {
    color: "#5b6470",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  connectionValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  connectionMessage: {
    color: "#166534",
    fontSize: 14,
    lineHeight: 20,
  },
  warningText: {
    color: "#9a3412",
    fontSize: 14,
    lineHeight: 20,
  },
  editorCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  actionStack: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dcc9b5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    backgroundColor: "#fffcf8",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#c46a2d",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff8f1",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#17324d",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#f8f4ed",
    fontSize: 15,
    fontWeight: "700",
  },
  ghostButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcc9b5",
  },
  ghostButtonText: {
    color: "#5b6470",
    fontSize: 15,
    fontWeight: "700",
  },
  tipText: {
    color: "#5b6470",
    fontSize: 13,
    lineHeight: 20,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  qrValue: {
    color: "#5b6470",
    fontSize: 12,
    lineHeight: 18,
  },
  healthCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  healthLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  healthLoadingText: {
    color: "#44515f",
    fontSize: 14,
  },
  healthStatus: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  healthMeta: {
    color: "#5b6470",
    fontSize: 13,
  },
  healthBody: {
    color: "#1f2937",
    fontSize: 14,
    lineHeight: 20,
  },
  moduleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  moduleName: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  readinessPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readinessText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  moduleSummary: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  defaultRow: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  defaultName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  defaultValue: {
    color: "#5b6470",
    fontSize: 13,
  },
})
