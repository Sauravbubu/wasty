import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

type AppTabButtonProps = TabTriggerSlotProps & {
  icon: TabIconName;
  label: string;
  isScan?: boolean;
};

function AppTabButton({
  children,
  isFocused,
  icon,
  label,
  isScan = false,
  ...props
}: AppTabButtonProps) {
  if (isScan) {
    return (
      <Pressable {...props} style={({ pressed }) => [styles.scanWrap, pressed && styles.pressed]}>
        <View style={styles.scanOuterRing}>
          <View style={styles.scanButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={30} color="#76ff98" />
          </View>
        </View>
        <Text style={styles.scanLabel}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, isFocused && styles.iconWrapFocused]}>
        <Ionicons
          name={icon}
          size={24}
          color={isFocused ? '#ffffff' : '#9ab8ad'}
        />
      </View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{children ?? label}</Text>
    </Pressable>
  );
}

export default function AppTabs() {
  const pathname = usePathname();
  const hideTabBar = pathname === '/scan';

  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList style={styles.hiddenTabList}>
        <TabTrigger name="home" href="/" />
        <TabTrigger name="history" href="/history" />
        <TabTrigger name="scan" href="/scan" />
        <TabTrigger name="wallet" href="/wallet" />
        <TabTrigger name="profile" href="/profile" />
      </TabList>

      {!hideTabBar && (
        <View style={styles.tabBar}>
          <TabTrigger name="home" asChild>
            <AppTabButton icon="home" label="Home">
              Home
            </AppTabButton>
          </TabTrigger>

          <TabTrigger name="history" asChild>
            <AppTabButton icon="time-outline" label="History">
              History
            </AppTabButton>
          </TabTrigger>

          <TabTrigger name="scan" asChild>
            <AppTabButton icon="qr-code-outline" label="SCAN" isScan>
              SCAN
            </AppTabButton>
          </TabTrigger>

          <TabTrigger name="wallet" asChild>
            <AppTabButton icon="wallet-outline" label="Wallet">
              Wallet
            </AppTabButton>
          </TabTrigger>

          <TabTrigger name="profile" asChild>
            <AppTabButton icon="person-outline" label="Profile">
              Profile
            </AppTabButton>
          </TabTrigger>
        </View>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    flex: 1,
  },
  hiddenTabList: {
    display: 'none',
  },
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    height: 96,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
    shadowColor: '#8ca395',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: '#0f6b4a',
    shadowColor: '#0f6b4a',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ab8ad',
  },
  tabLabelFocused: {
    color: '#0f6b4a',
  },
  scanWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -48,
    gap: 8,
  },
  scanOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f7faf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8ca395',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  scanButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#005c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f6b4a',
  },
  pressed: {
    opacity: 0.82,
  },
});
