import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  NativeModules,
  NativeEventEmitter,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { RoomScannerModule } = NativeModules;
const roomScannerEmitter = new NativeEventEmitter(RoomScannerModule);

interface RoomScannerNativeProps {
  customerId: string;
  onScanComplete: (data: any) => void;
}

const RoomScannerNative: React.FC<RoomScannerNativeProps> = ({ customerId, onScanComplete }) => {
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState({
    roomVolume: 0,
    furnitureCount: 0,
    furniture: [],
    walls: 0,
    doors: 0,
    windows: 0
  });
  const [deviceSupported, setDeviceSupported] = useState<boolean | null>(null);
  const [supportReason, setSupportReason] = useState('');

  useEffect(() => {
    checkDeviceSupport();
    
    // Set up event listeners
    const updateSubscription = roomScannerEmitter.addListener('onRoomCaptureUpdate', (data) => {
      setScanData(data);
    });
    
    const furnitureSubscription = roomScannerEmitter.addListener('onFurnitureDetected', (data) => {
      console.log('Möbel erkannt:', data.furniture);
    });
    
    const volumeSubscription = roomScannerEmitter.addListener('onVolumeCalculated', (data) => {
      console.log('Volumen berechnet:', data.volume, data.unit);
    });
    
    const completeSubscription = roomScannerEmitter.addListener('onRoomCaptureComplete', (data) => {
      handleScanComplete(data);
    });
    
    const errorSubscription = roomScannerEmitter.addListener('onRoomCaptureError', (data) => {
      Alert.alert('Scan-Fehler', data.error);
      setIsScanning(false);
    });
    
    return () => {
      updateSubscription.remove();
      furnitureSubscription.remove();
      volumeSubscription.remove();
      completeSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  const checkDeviceSupport = async () => {
    if (Platform.OS !== 'ios') {
      setDeviceSupported(false);
      setSupportReason('AR Room Scanning ist nur auf iOS verfügbar');
      return;
    }

    try {
      const support = await RoomScannerModule.checkDeviceSupport();
      setDeviceSupported(support.supported);
      if (!support.supported) {
        setSupportReason(support.reason || 'Gerät wird nicht unterstützt');
      }
    } catch (error) {
      setDeviceSupported(false);
      setSupportReason('Fehler beim Prüfen der Geräteunterstützung');
    }
  };

  const startScanning = async () => {
    if (!deviceSupported) {
      Alert.alert(
        'Nicht unterstützt',
        supportReason,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    try {
      await RoomScannerModule.startRoomCapture({
        enableCoaching: true,
        enableAutoStop: true
      });
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Raumscan nicht starten');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      const result = await RoomScannerModule.stopRoomCapture();
      handleScanComplete(result);
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Beenden des Scans');
    }
    setIsScanning(false);
  };

  const handleScanComplete = (data: any) => {
    // Save to database
    const scanResult = {
      customerId,
      roomVolume: data.volume || scanData.roomVolume,
      furniture: data.furniture || scanData.furniture,
      dimensions: data.dimensions,
      summary: data.summary,
      scanDate: new Date().toISOString(),
      exportPath: data.exportPath
    };

    onScanComplete(scanResult);
    
    // Show summary
    Alert.alert(
      'Scan abgeschlossen',
      `Raumvolumen: ${scanResult.roomVolume.toFixed(2)} m³\nMöbel erkannt: ${scanResult.furniture.length}`,
      [
        { text: 'Details anzeigen', onPress: () => showDetails(scanResult) },
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const showDetails = (result: any) => {
    // Navigate to detail view or show modal
    console.log('Scan Details:', result);
  };

  if (deviceSupported === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Prüfe Geräteunterstützung...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>AR Raumscan</Text>
      </View>

      {!deviceSupported ? (
        <View style={styles.unsupportedContainer}>
          <Icon name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.unsupportedTitle}>Nicht unterstützt</Text>
          <Text style={styles.unsupportedText}>{supportReason}</Text>
          <Text style={styles.requirementText}>
            Benötigt: iPhone 12 Pro oder neuer mit iOS 16+
          </Text>
        </View>
      ) : (
        <>
          {!isScanning ? (
            <View style={styles.startContainer}>
              <Icon name="view-in-ar" size={100} color="#007AFF" />
              <Text style={styles.instructionTitle}>Raum scannen</Text>
              <Text style={styles.instructionText}>
                Bewegen Sie Ihr Gerät langsam durch den Raum.{'\n'}
                Die AR-Technologie erkennt automatisch:{'\n\n'}
                • Raummaße und Volumen{'\n'}
                • Möbel und Einrichtung{'\n'}
                • Türen und Fenster
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={startScanning}>
                <Text style={styles.startButtonText}>Scan starten</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanningContainer}>
              <View style={styles.scanInfo}>
                <Text style={styles.scanInfoTitle}>Scanvorgang läuft...</Text>
                <Text style={styles.scanInfoText}>
                  Bewegen Sie das Gerät langsam und gleichmäßig
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{scanData.roomVolume.toFixed(1)} m³</Text>
                  <Text style={styles.statLabel}>Raumvolumen</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{scanData.furnitureCount}</Text>
                  <Text style={styles.statLabel}>Möbel erkannt</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{scanData.walls}</Text>
                  <Text style={styles.statLabel}>Wände</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.stopButton} onPress={stopScanning}>
                <Text style={styles.stopButtonText}>Scan beenden</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  unsupportedTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  unsupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  requirementText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  instructionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  scanningContainer: {
    flex: 1,
    padding: 16
  },
  scanInfo: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center'
  },
  scanInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  scanInfoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32
  },
  statBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF'
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    alignSelf: 'center'
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  }
});

export default RoomScannerNative;