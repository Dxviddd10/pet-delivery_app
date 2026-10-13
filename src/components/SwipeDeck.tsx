import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const THRESHOLD = SCREEN_W * 0.27;

export type SwipeDirection = 'like' | 'pass';

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactElement;
  onSwipe: (item: T, direction: SwipeDirection) => void;
  empty: ReactElement;
};

export function SwipeDeck<T>({ items, keyOf, renderCard, onSwipe, empty }: Props<T>) {
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // Refs para que el PanResponder (creado una sola vez) siempre lea valores actuales
  const itemsRef = useRef(items);
  const indexRef = useRef(index);
  const onSwipeRef = useRef(onSwipe);
  itemsRef.current = items;
  indexRef.current = index;
  onSwipeRef.current = onSwipe;
  const busy = useRef(false);

  const forceSwipe = useCallback(
    (dir: SwipeDirection) => {
      if (busy.current || !itemsRef.current[indexRef.current]) return;
      busy.current = true;
      Animated.timing(position, {
        toValue: { x: dir === 'like' ? SCREEN_W * 1.4 : -SCREEN_W * 1.4, y: 0 },
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        const item = itemsRef.current[indexRef.current];
        position.setValue({ x: 0, y: 0 });
        setIndex((i) => i + 1);
        busy.current = false;
        if (item) onSwipeRef.current(item, dir);
      });
    },
    [position],
  );
  const forceSwipeRef = useRef(forceSwipe);
  forceSwipeRef.current = forceSwipe;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !busy.current,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && !busy.current,
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.2 }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) forceSwipeRef.current('like');
        else if (g.dx < -THRESHOLD) forceSwipeRef.current('pass');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
    }),
  ).current;

  useEffect(() => () => position.stopAnimation(), [position]);

  const current = items[index];
  const next = items[index + 1];
  if (!current) return empty;

  const rotate = position.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-14deg', '0deg', '14deg'] });
  const likeOpacity = position.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = position.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: [1, 0.94, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.wrap}>
      <View style={styles.stack}>
        {next ? (
          <Animated.View key={keyOf(next)} style={[styles.layer, { transform: [{ scale: nextScale }] }]}>
            {renderCard(next)}
          </Animated.View>
        ) : null}
        <Animated.View
          key={keyOf(current)}
          style={[styles.layer, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
          {...panResponder.panHandlers}
        >
          {renderCard(current)}
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.like }]}>ME ENCANTA</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
            <Text style={[styles.stampText, { color: colors.pass }]}>PASO</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pasar a la siguiente mascota"
          onPress={() => forceSwipe('pass')}
          style={[styles.actionBtn, { borderColor: colors.pass }]}
        >
          <Text style={{ fontSize: 28 }}>✖️</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Me interesa esta mascota"
          onPress={() => forceSwipe('like')}
          style={[styles.actionBtn, { borderColor: colors.like }]}
        >
          <Text style={{ fontSize: 28 }}>💚</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  stack: { flex: 1 },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: space.xl, paddingVertical: space.lg },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  stamp: { position: 'absolute', top: 32, borderWidth: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
  stampLike: { left: 24, borderColor: colors.like, transform: [{ rotate: '-12deg' }] },
  stampPass: { right: 24, borderColor: colors.pass, transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 22, fontWeight: '900' },
});
