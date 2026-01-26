import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const COMPANIES = [
  { id: "1", name: "Robinhood", price: 50 },
  { id: "2", name: "McDonalds", price: 25 },
  { id: "3", name: "Walmart", price: 25 },
  { id: "4", name: "Shell", price: 50 },
  { id: "5", name: "General Electric", price: 50 },
  { id: "6", name: "J&J", price: 75 },
  { id: "7", name: "Apple", price: 20 },
  { id: "8", name: "KTM", price: 50 },
  { id: "9", name: "PlayStation", price: 25 },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Анимация для прогресс-бара
  const progress = useSharedValue(0.2);

  // Анимация для контента (уход элементов)
  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((step + 1) / 5);
  }, [step]);

  const handleNext = () => {
    if (step < 4) {
      contentOpacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setStep)(step + 1);
        contentTranslateX.value = width;
        contentOpacity.value = withTiming(1, { duration: 300 });
        contentTranslateX.value = withTiming(0, { duration: 300 });
      });
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(tabs)");
  };

  const totalPrice = useMemo(() => {
    if (selectedCompanies.length === 0) return 180;
    return COMPANIES.filter((c) => selectedCompanies.includes(c.id)).reduce(
      (sum, c) => sum + c.price,
      0
    );
  }, [selectedCompanies]);

  return (
    <View style={styles.container}>
      {/* Прогресс-бар */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[styles.progressBar, { width: `${(step + 1) * 20}%` }]}
        />
      </View>

      {step > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateX: contentTranslateX }],
          },
        ]}
      >
        {step === 0 && <WelcomeStep />}
        {step === 1 && <MoneyStep />}
        {step === 2 && <EasyWayStep />}
        {step === 3 && (
          <ChooseStep
            selected={selectedCompanies}
            setSelected={setSelectedCompanies}
            onNone={() => {
              setSelectedCompanies([]);
              handleNext();
            }}
          />
        )}
        {step === 4 && <EarningStep total={totalPrice} />}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            step === 3 &&
              selectedCompanies.length === 0 &&
              styles.buttonDisabled,
          ]}
          onPress={() => {
            if (step === 3 && selectedCompanies.length === 0) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              return;
            }
            handleNext();
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Под-компоненты для шагов ---

function WelcomeStep() {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>Welcome to PayMe</Text>
      <Text style={styles.subtitle}>{`Helping you claim what\'s yours.`}</Text>
    </View>
  );
}

function MoneyStep() {
  const count = useSharedValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    count.value = withTiming(42, {
      duration: 2000,
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    });
    // Слушатель для обновления UI
    const interval = setInterval(() => {
      setDisplayCount(Math.floor(count.value));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.center}>
      <Text style={styles.bigNumber}>${displayCount} Billion</Text>
      <Text style={styles.subtitle}>Recovered by people like you</Text>
    </View>
  );
}

function EasyWayStep() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>3 Easy Steps</Text>
      <View style={styles.list}>
        {["Choose companies", "Check eligibility", "Get your money"].map(
          (item, i) => (
            <Animated.View key={i} style={styles.listItem}>
              <Text style={styles.listText}>
                {i + 1}. {item}
              </Text>
            </Animated.View>
          )
        )}
      </View>
    </View>
  );
}

function ChooseStep({ selected, setSelected, onNone }: any) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i: string) => i !== id));
    } else {
      setSelected([...selected, id]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.fullWidth}>
      <Text style={styles.title}>Selected: {selected.length}</Text>
      <FlatList
        data={COMPANIES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selected.includes(item.id) && styles.cardActive,
            ]}
            onPress={() => toggle(item.id)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity onPress={onNone} style={styles.noneButton}>
        <Text>None of these</Text>
      </TouchableOpacity>
    </View>
  );
}

function EarningStep({ total }: { total: number }) {
  return (
    <View style={styles.center}>
      <Text style={styles.subtitle}>Your potential earnings:</Text>
      <Text style={styles.bigNumber}>${total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: 60 },
  progressContainer: {
    height: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressBar: { height: "100%", backgroundColor: "#007AFF", borderRadius: 2 },
  backButton: { position: "absolute", top: 70, left: 20, zIndex: 10 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  center: { alignItems: "center" },
  fullWidth: { width: "100%", flex: 1, marginTop: 40 },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 18, color: "#666", textAlign: "center", marginTop: 10 },
  bigNumber: { fontSize: 48, fontWeight: "900", color: "#007AFF" },
  footer: { padding: 20, paddingBottom: 40 },
  button: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#CCC" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  list: {},
  listItem: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: width * 0.8,
  },
  listText: { fontSize: 16, fontWeight: "500" },
  card: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    margin: 5,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardActive: { borderColor: "#007AFF", backgroundColor: "#E6F0FF" },
  noneButton: { marginTop: 20, alignItems: "center" },
});
