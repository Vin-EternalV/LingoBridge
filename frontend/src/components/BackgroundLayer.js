import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';

// text: 'dark' = dark text on the picture (light veil), 'light' = light text (dark veil).
export const scrimFor = (text) => (text === 'light' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.55)');

// Draws the picture behind its children. Screens use a transparent background while a picture is active.
const BackgroundLayer = ({ uri, text, children }) => (
  <View style={[styles.root, { backgroundColor: text === 'light' ? '#0F172A' : '#F8FAFC' }]}>
    {!!uri && (
      <ImageBackground source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: scrimFor(text) }]} />
      </ImageBackground>
    )}
    {children}
  </View>
);

// ---- Per-screen backgrounds ----
// On phones the stack navigator puts every screen in its own native layer with an opaque backdrop,
// so a picture drawn once at the root would be hidden behind it. Each screen therefore draws its own copy.
let current = { uri: null, text: 'dark' };

// Called once from App.js (before the navigators render) with the picture chosen on this device.
export const setBackgroundImageState = (uri, text) => {
  current = { uri: uri || null, text: text === 'light' ? 'light' : 'dark' };
};

export const ScreenBackground = ({ children }) => (
  <BackgroundLayer uri={current.uri} text={current.text}>
    {children}
  </BackgroundLayer>
);

const cache = new WeakMap();

// Wraps a screen component so it is drawn on top of the picture. Returns the screen unchanged
// when no picture is set, and always returns the same wrapper for the same screen (no remounting).
export const withBackground = (Component) => {
  if (!current.uri) return Component;
  if (!cache.has(Component)) {
    const Wrapped = (props) => (
      <ScreenBackground>
        <Component {...props} />
      </ScreenBackground>
    );
    Wrapped.displayName = `WithBackground(${Component.displayName || Component.name || 'Screen'})`;
    cache.set(Component, Wrapped);
  }
  return cache.get(Component);
};

const styles = StyleSheet.create({ root: { flex: 1 } });

export default BackgroundLayer;
