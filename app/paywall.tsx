import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from "expo-glass-effect";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get("window");

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'year' | 'month'>('year');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Если истории нет (например, зашли сразу после онбординга), 
      // кидаем на главную
      router.replace("/(tabs)");
    }
  };

  const handleContinue = async () => {
    // await AsyncStorage.setItem('isPremium', 'true');
    router.replace('/(tabs)');
  };

  const FeatureItem = ({ icon, text }: { icon: string, text: string }) => (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[Typography.medium16, { color: Colors.black, fontSize: 14, }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.Image
        entering={FadeInRight.delay(200)} exiting={FadeOutLeft}
        source={require('@/assets/images/onboarding/onboaring_coins_2.png')} 
        style={styles.illustration}
        resizeMode="contain"
      />
      <View style={styles.scrollContent}>
        <View>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="black" />
          </Pressable>

          <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft} style={{marginTop: 10}}>
            <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
              Claim Back
            </Text>
            <Text
              style={[
                Typography.bold20,
                { fontSize: 32, lineHeight: 40, color: Colors.blue },
              ]}
            >
              Your Settlements
            </Text>
          </Animated.View>
        </View>

        <View style={{flex:1, alignItems: 'center', justifyContent: 'center'}}>
        {/* {!isLiquidGlassAvailable() ? (
          <Animated.View entering={FadeInRight.delay(200)} exiting={FadeOutLeft} style={styles.glassCardWrapper}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 30 : 90} 
              tint='extraLight'
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.blurBorder}
              >
                <Text style={[Typography.bold20, {textAlign: 'center'}]}>
                  Did you know?
                </Text>
                <Text style={[Typography.medium16, {textAlign: 'center', marginTop: 16}]}>
                  “In 2024 over <Text style={{color: Colors.blue}}>$42 Billion was paid</Text> out in class-action settlements”
                </Text>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        ) : ( */}
          <GlassView style={styles.blurContainer} isInteractive>
            <FeatureItem icon="🔍" text="Discover Eligible Claims" />
            <FeatureItem icon="📝" text="File Claims in Minutes" />
            <FeatureItem icon="🔒" text="Keep Data Private and Secure" />
            <FeatureItem icon="⏰" text="Never Miss Deadlines" />
            <FeatureItem icon="🚫" text="No SignUp Required" />
          </GlassView>
        {/* )} */}

        </View>

        <View style={{}}>
          <Text style={[Typography.semibold24, styles.planTitle]}>CHOOSE YOUR PLAN</Text>

          <Pressable 
            onPress={() => setSelectedPlan('year')}
            style={[styles.planCard, selectedPlan === 'year' && styles.planCardActive]}
          >
            <View>
              <Text style={[{color: selectedPlan === 'year' ? Colors.black : Colors.gray}, Typography.medium16]}>1 year <Text style={[{color: selectedPlan === 'year' ? Colors.blue : Colors.black}, Typography.bold16]}>$39.99</Text></Text>
              <Text style={[Typography.medium16, {color: Colors.gray}]}>only <Text style={[{color: selectedPlan === 'year' ? Colors.blue : Colors.black}, Typography.bold16]}>$3.33</Text> per month</Text>
            </View>
            <View style={styles.bestOfferBadge}>
              <Text style={styles.bestOfferText}>BEST OFFER</Text>
            </View>
            <Ionicons 
              name={selectedPlan === 'year' ? "checkmark-circle" : "ellipse"} 
              size={24} 
              color={selectedPlan === 'year' ? Colors.blue : Colors.secondary} 
            />
          </Pressable>

          <Pressable 
            onPress={() => setSelectedPlan('month')}
            style={[styles.planCard, selectedPlan === 'month' && styles.planCardActive, { marginTop: 12 }]}
          >
            <Text style={[{color: selectedPlan === 'month' ? Colors.black : Colors.gray}, Typography.medium16]}>1 month <Text style={[{color: selectedPlan === 'month' ? Colors.blue : Colors.black}, Typography.bold16]}>$17.99</Text></Text>
            <Ionicons 
              name={selectedPlan === 'month' ? "checkmark-circle" : "ellipse"} 
              size={24} 
              color={selectedPlan === 'month' ? Colors.blue : Colors.secondary} 
            />
          </Pressable>

          <Pressable onPress={handleContinue} style={styles.primaryButton}>
            <Text style={[Typography.bold20, { color: 'white' }]}>Continue</Text>
          </Pressable>

          <Text style={styles.footerNote}>🕒 Auto Renewals / Cancel Anytime</Text>
          
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Terms of Use</Text>
            <Text style={styles.footerLink}>Restore</Text>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    // paddingBottom: 40,
    justifyContent: 'space-between'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCardWrapperAnimated: {

  },
  glassCardWrapper: { 
    
  },
  blurContainer: {
    borderRadius: 34,
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  illustration: {
    resizeMode: "cover",
    position: 'absolute',
    width: width + 20,
    height: width + 20,
    top: '50%',
    left: '50%',
    marginLeft: -(width + 20) / 2,
    marginTop: -(width + 20) / 2,
    zIndex: -1,
    opacity: 0.4,
  },
  featureRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  featureIcon: { fontSize: 20 },
  planTitle: {
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 25,
    fontSize: 30,
    lineHeight: 32,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: Colors.secondary,
    minHeight: 60,
    backgroundColor: Colors.white
  },
  planCardActive: { borderColor: Colors.blue },
  bestOfferBadge: { position: 'absolute', top: -12, right: 50, backgroundColor: Colors.blue, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  bestOfferText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  primaryButton: {
    backgroundColor: Colors.blue,
    minHeight: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  footerNote: { textAlign: 'center', marginTop: 15, color: Colors.gray, fontSize: 11 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 10, },
  footerLink: { color: "#5F6B99", fontSize: 11, textDecorationLine: 'underline' },
});