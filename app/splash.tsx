import React, { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Animated, Easing, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

export default function SplashScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const navigateToLogin = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      router.replace("/login");
    });
  }, [fadeAnim, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    particleAnims.forEach((particle, index) => {
      const angle = (index / particleAnims.length) * Math.PI * 2;
      const radius = 120;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: Math.cos(angle) * radius,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.sin(angle) * radius,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    });

    const timer = setTimeout(() => {
      navigateToLogin();
    }, 4000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigateToLogin]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Pressable style={styles.container} onPress={navigateToLogin}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />

      <View style={styles.backgroundDust}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dustParticle,
              {
                backgroundColor: theme.text,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                opacity: Math.random() * 0.3,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {particleAnims.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.orbitParticle,
              {
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: theme.primary,
              shadowColor: theme.primary,
              opacity: glowOpacity,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.resumeCard,
            {
              shadowColor: theme.primary,
              transform: [
                { rotate },
                { rotateX: "15deg" },
                { perspective: 1000 },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLine} />
              <View style={[styles.cardLine, styles.cardLineShort]} />
              <View style={styles.cardLine} />
              <View style={[styles.cardLine, styles.cardLineMedium]} />
              <View style={styles.cardSpacer} />
              <View style={[styles.cardLine, styles.cardLineShort]} />
              <View style={styles.cardLine} />
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.highlight,
            {
              opacity: glowAnim,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundDust: {
    ...StyleSheet.absoluteFillObject,
  },
  dustParticle: {
    position: "absolute",
    borderRadius: 100,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "transparent",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  orbitParticle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  resumeCard: {
    width: 140,
    height: 180,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-evenly",
  },
  cardLine: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 2,
  },
  cardLineShort: {
    width: "60%",
  },
  cardLineMedium: {
    width: "80%",
  },
  cardSpacer: {
    height: 12,
  },
  highlight: {
    position: "absolute",
    top: -60,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    opacity: 0.3,
  },
});
