import { useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera"
import { SafeAreaView } from "react-native-safe-area-context"

import { normalizeApiBaseUrl } from "@mobile/config/mobile-config"

export function BackendQrScannerScreen({
  onCancel,
  onResolved,
}: {
  onCancel: () => void
  onResolved: (apiBaseUrl: string) => void
}) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanLocked, setScanLocked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleCodeScanned(result: BarcodeScanningResult) {
    if (scanLocked) {
      return
    }

    const apiBaseUrl = normalizeApiBaseUrl(result.data)

    if (!apiBaseUrl) {
      setScanLocked(true)
      setErrorMessage(
        "The QR code did not contain a valid backend URL. Scan a direct http/https URL or a codexsun connect QR."
      )
      return
    }

    setScanLocked(true)
    setErrorMessage(null)
    onResolved(apiBaseUrl)
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.shell}>
          <Text style={styles.title}>QR scanner is for device testing</Text>
          <Text style={styles.copy}>
            Open this screen in Expo Go on Android. Browser mode cannot reliably represent the mobile camera flow.
          </Text>
          <Text style={styles.tip}>
            Supported QR values: `http://192.168.x.x:3000` or
            `codexsun-mobile://connect?apiBaseUrl=http%3A%2F%2F192.168.x.x%3A3000`
          </Text>
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.shell}>
          <Text style={styles.title}>Loading camera permission</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.shell}>
          <Text style={styles.title}>Camera access required</Text>
          <Text style={styles.copy}>
            Allow camera access so the mobile app can scan a backend QR code and connect to your server.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.cameraSafeArea}>
      <View style={styles.cameraHeader}>
        <Text style={styles.cameraTitle}>Scan backend QR</Text>
        <Text style={styles.cameraCopy}>
          Point the camera at a QR that contains your backend URL.
        </Text>
      </View>

      <View style={styles.cameraFrame}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleCodeScanned}
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.scanWindow} />
        </View>
      </View>

      <View style={styles.cameraFooter}>
        <Text style={styles.tip}>
          Supported QR values: `http://192.168.x.x:3000` or
          `codexsun-mobile://connect?apiBaseUrl=http%3A%2F%2F192.168.x.x%3A3000`
        </Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.actionRow}>
          {scanLocked ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setScanLocked(false)
                setErrorMessage(null)
              }}
            >
              <Text style={styles.primaryButtonText}>Scan again</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5efe6",
  },
  cameraSafeArea: {
    flex: 1,
    backgroundColor: "#09141f",
  },
  shell: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    color: "#1f2937",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  copy: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
  },
  cameraHeader: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  cameraTitle: {
    color: "#f8f4ed",
    fontSize: 28,
    fontWeight: "800",
  },
  cameraCopy: {
    color: "#d0d8e1",
    fontSize: 14,
    lineHeight: 20,
  },
  cameraFrame: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4, 12, 20, 0.25)",
  },
  scanWindow: {
    width: 240,
    height: 240,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#f3b562",
    backgroundColor: "transparent",
  },
  cameraFooter: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  tip: {
    color: "#d0d8e1",
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#c46a2d",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff8f1",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d5c3af",
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#f8f4ed",
    fontSize: 15,
    fontWeight: "700",
  },
})
