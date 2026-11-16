import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView, type WebViewNavigation } from "react-native-webview";

const APP_URL = "https://bjeyflow.space/";
const APP_ORIGIN = new URL(APP_URL).origin;

export default function App() {
  const browser = useRef<WebView<object>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [source, setSource] = useState(APP_URL);

  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack || failed) return false;
      browser.current?.goBack();
      return true;
    });
    return () => listener.remove();
  }, [canGoBack, failed]);

  const navigate = (url: string) => {
    try {
      const target = new URL(url);
      if (target.origin === APP_ORIGIN) return true;
      if (target.protocol === "https:") void Linking.openURL(target.href);
    } catch {
      return false;
    }
    return false;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {failed ? (
          <View style={styles.empty}>
            <View style={styles.mark}>
              <Text style={styles.markText}>B.</Text>
            </View>
            <Text style={styles.title}>A little pause.</Text>
            <Text style={styles.description}>
              BjeyFlow couldn't connect. Check your internet connection and try
              again.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setFailed(false);
                setAttempt((value) => value + 1);
              }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <WebView<object>
            key={attempt}
            ref={browser}
            source={{ uri: source }}
            originWhitelist={["*"]}
            onShouldStartLoadWithRequest={(request) => navigate(request.url)}
            onOpenWindow={(event) => {
              const url = event.nativeEvent.targetUrl;
              if (navigate(url)) setSource(url);
            }}
            onNavigationStateChange={(state: WebViewNavigation) =>
              setCanGoBack(state.canGoBack)
            }
            onError={() => setFailed(true)}
            allowFileAccess={false}
            allowUniversalAccessFromFileURLs={false}
            mixedContentMode="never"
            sharedCookiesEnabled
            javaScriptEnabled
            domStorageEnabled
            pullToRefreshEnabled={Platform.OS === "android"}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#24536b" />
                <Text style={styles.loadingText}>Finding your flow…</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f8fa" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#dceef5",
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: "#023047", fontSize: 28, fontWeight: "700" },
  title: { marginTop: 24, color: "#023047", fontSize: 28, fontWeight: "700" },
  description: {
    marginTop: 12,
    color: "#526c79",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#023047",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f8fa",
  },
  loadingText: { marginTop: 14, color: "#526c79", fontSize: 13 },
});
