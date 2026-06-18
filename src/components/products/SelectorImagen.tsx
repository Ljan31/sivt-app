import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  Alert,
  Image, StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';

// ─── SelectorImagen ────────────────────────────────────────────────────────
// La imagen se guarda via guardarImagenProducto (Equipo 1) después de crear
// el producto y tener su ID. Aquí solo manejamos el URI local temporal.

interface Props {
  uri: string | null;           // URI temporal pre-guardado
  onChange: (uri: string) => void;
  onQuitar: () => void;
}

export function SelectorImagen({ uri, onChange, onQuitar }: Props) {
  async function abrir() {
    Alert.alert('Imagen del producto', '', [
      {
        text: '📷 Cámara',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const r = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.75,
          });
          if (!r.canceled) onChange(r.assets[0].uri);
        },
      },
      {
        text: '🖼 Galería',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, aspect: [1, 1], quality: 0.75,
          });
          if (!r.canceled) onChange(r.assets[0].uri);
        },
      },
      uri ? { text: 'Quitar imagen', style: 'destructive', onPress: onQuitar } : null,
      { text: 'Cancelar', style: 'cancel' },
    ].filter(Boolean) as any);
  }

  return (
    <TouchableOpacity style={styles.wrap} onPress={abrir} activeOpacity={0.8}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.img} />
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>Cambiar</Text>
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderTxt}>Agregar foto</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const S = StyleSheet.create;
const styles = S({
  wrap: {
    width: 108, height: 108,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  img: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4, alignItems: 'center',
  },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  placeholderIcon: { fontSize: 26 },
  placeholderTxt: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
});
