import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

// Draws the picture behind its children. Screens use a transparent background while a picture is active.
const BackgroundLayer = ({ children }) => (
  <View style={styles.root}>
    {COLORS.background !== '#FFFFFF' && (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.orb, styles.mintOrb]} />
        <View style={[styles.orb, styles.blueOrb]} />
        <View style={[styles.orb, styles.goldOrb]} />
      </View>
    )}
    {children}
  </View>
);

export const ScreenBackground = ({ children }) => (
  <BackgroundLayer>{children}</BackgroundLayer>
);

const cache = new WeakMap();

// Wraps a screen component so it is drawn on top of the picture. Returns the screen unchanged
// when no picture is set, and always returns the same wrapper for the same screen (no remounting).
export const withBackground = (Component) => {
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

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: COLORS.background },
  orb: { position: 'absolute', borderRadius: 9999 },
  mintOrb: { width: 550, height: 550, top: -243, left: -202, backgroundColor: COLORS.backgroundOrbMint },
  blueOrb: { width: 450, height: 450, top: 130, right: -225, backgroundColor: COLORS.backgroundOrbBlue },
  goldOrb: { width: 280, height: 280, bottom: -188, left: '22%', backgroundColor: COLORS.backgroundOrbGold },
});

export default BackgroundLayer;
