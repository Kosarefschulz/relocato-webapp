import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import ARKit, { ARKitManager } from 'react-native-arkit';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ARMeasurement,
  ARPoint,
  ARSession,
  FurnitureDetection,
  ARCapabilities
} from '../types/ar';
import { WebBridge } from '../services/webBridge';
import { ARProcessingService } from '../services/arProcessingService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARScannerProps {
  sessionId: string;
  roomName: string;
  onComplete: (session: ARSession) => void;
  onCancel: () => void;
}

export const ARScanner: React.FC<ARScannerProps> = ({
  sessionId,
  roomName,
  onComplete,
  onCancel
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<'measure' | 'scan'>('measure');
  const [measurements, setMeasurements] = useState<ARMeasurement[]>([]);
  const [detections, setDetections] = useState<FurnitureDetection[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<ARPoint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capabilities, setCapabilities] = useState<ARCapabilities | null>(null);
  
  const arSessionRef = useRef<ARSession>({
    id: sessionId,
    startTime: new Date(),
    measurements: [],
    detectedPlanes: [],
    capturedImages: []
  });

  useEffect(() => {
    checkPermissionsAndInit();
    checkDeviceCapabilities();
  }, []);

  const checkDeviceCapabilities = async () => {
    const caps: ARCapabilities = {
      hasARKit: Platform.OS === 'ios' && ARKitManager !== undefined,
      hasLiDAR: await ARProcessingService.checkLiDARSupport(),
      arKitVersion: '4.0',
      deviceModel: await ARProcessingService.getDeviceModel()
    };
    setCapabilities(caps);
    
    // Send capabilities to web app
    WebBridge.sendMessage({
      type: 'capabilities',
      data: caps,
      timestamp: new Date().toISOString()
    });
  };

  const checkPermissionsAndInit = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await check(permission);
      
      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Kamera-Berechtigung erforderlich',
            'Bitte erlauben Sie den Kamerazugriff für AR-Messungen.',
            [{ text: 'OK', onPress: onCancel }]
          );
          return;
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Fehler', 'Fehler beim Überprüfen der Berechtigungen');
    }
  };

  const handleARKitPlaneDetection = (planes: any) => {
    // Update detected planes in session
    arSessionRef.current.detectedPlanes = planes.map((plane: any) => ({
      id: plane.id,
      type: plane.alignment === 0 ? 'horizontal' : 'vertical',
      center: {
        x: plane.center.x,
        y: plane.center.y,
        z: plane.center.z
      },
      extent: {
        width: plane.extent.x,
        height: plane.extent.z
      },
      transform: plane.transform
    }));
  };

  const handleTapOnScreen = async (event: any) => {
    if (currentMode === 'measure') {
      const point = await ARProcessingService.hitTest(event.nativeEvent);
      if (point) {
        handleMeasurementPoint(point);
      }
    } else {
      // Scan mode - capture and analyze
      captureAndAnalyze();
    }
  };

  const handleMeasurementPoint = (point: ARPoint) => {
    const newPoints = [...selectedPoints, point];
    setSelectedPoints(newPoints);

    if (newPoints.length === 2) {
      // Calculate distance
      const distance = ARProcessingService.calculateDistance(newPoints[0], newPoints[1]);
      const measurement: ARMeasurement = {
        id: `measure_${Date.now()}`,
        type: 'distance',
        points: newPoints,
        value: distance,
        unit: distance > 100 ? 'm' : 'cm',
        confidence: 0.95,
        timestamp: new Date()
      };
      
      const updatedMeasurements = [...measurements, measurement];
      setMeasurements(updatedMeasurements);
      arSessionRef.current.measurements = updatedMeasurements;
      
      // Send to web app
      WebBridge.sendMessage({
        type: 'measurement',
        data: measurement,
        timestamp: new Date().toISOString()
      });
      
      // Reset points
      setSelectedPoints([]);
    } else if (newPoints.length === 4) {
      // Calculate area
      const area = ARProcessingService.calculateArea(newPoints);
      const measurement: ARMeasurement = {
        id: `area_${Date.now()}`,
        type: 'area',
        points: newPoints,
        value: area,
        unit: 'm',
        confidence: 0.92,
        timestamp: new Date()
      };
      
      const updatedMeasurements = [...measurements, measurement];
      setMeasurements(updatedMeasurements);
      arSessionRef.current.measurements = updatedMeasurements;
      
      WebBridge.sendMessage({
        type: 'measurement',
        data: measurement,
        timestamp: new Date().toISOString()
      });
      
      setSelectedPoints([]);
    }
  };

  const captureAndAnalyze = async () => {
    setIsProcessing(true);
    try {
      // Capture current frame
      const imageData = await ARProcessingService.captureFrame();
      
      // If LiDAR is available, get depth data
      let depthData = null;
      if (capabilities?.hasLiDAR) {
        depthData = await ARProcessingService.getDepthData();
      }
      
      // Analyze for furniture
      const detection = await ARProcessingService.analyzeFurniture(imageData, depthData);
      
      if (detection) {
        const newDetections = [...detections, detection];
        setDetections(newDetections);
        
        // Send to web app
        WebBridge.sendMessage({
          type: 'detection',
          data: detection,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Fehler', 'Fehler beim Erfassen des Objekts');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRoomDimensions = () => {
    const horizontalPlanes = arSessionRef.current.detectedPlanes
      .filter(p => p.type === 'horizontal');
    
    if (horizontalPlanes.length > 0) {
      // Estimate room dimensions from largest horizontal plane
      const largestPlane = horizontalPlanes.reduce((prev, current) => 
        (prev.extent.width * prev.extent.height > current.extent.width * current.extent.height) 
          ? prev : current
      );
      
      arSessionRef.current.roomDimensions = {
        length: largestPlane.extent.width,
        width: largestPlane.extent.height,
        height: 2.5 // Default ceiling height
      };
    }
  };

  const completeSession = async () => {
    calculateRoomDimensions();
    arSessionRef.current.endTime = new Date();
    
    // Save session locally
    await AsyncStorage.setItem(
      `ar_session_${sessionId}`,
      JSON.stringify(arSessionRef.current)
    );
    
    // Send complete session to web app
    WebBridge.sendMessage({
      type: 'session',
      data: arSessionRef.current,
      timestamp: new Date().toISOString()
    });
    
    onComplete(arSessionRef.current);
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initialisiere AR...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ARKit
        style={styles.arView}
        debug
        planeDetection
        lightEstimation
        onPlaneDetected={handleARKitPlaneDetection}
        onTapOnPlaneUsingExtent={handleTapOnScreen}
        onARKitError={(error: any) => {
          console.error('ARKit error:', error);
          Alert.alert('AR Fehler', 'Ein Fehler ist aufgetreten');
        }}
      >
        {/* Render measurement points */}
        {selectedPoints.map((point, index) => (
          <ARKit.Sphere
            key={`point_${index}`}
            position={{ x: point.x, y: point.y, z: point.z }}
            shape={{ radius: 0.02 }}
            material={{ color: '#FF0000' }}
          />
        ))}
        
        {/* Render measurement lines */}
        {measurements.map((measurement) => (
          measurement.type === 'distance' && measurement.points.length === 2 && (
            <ARKit.Polyline
              key={measurement.id}
              points={measurement.points.map(p => ({ x: p.x, y: p.y, z: p.z }))}
              material={{ color: '#00FF00', lineWidth: 2 }}
            />
          )
        ))}
      </ARKit>

      {/* UI Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.roomName}>{roomName}</Text>
          <Text style={styles.measurementCount}>
            {measurements.length} Messungen | {detections.length} Objekte
          </Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, currentMode === 'measure' && styles.modeButtonActive]}
            onPress={() => setCurrentMode('measure')}
          >
            <Text style={[styles.modeButtonText, currentMode === 'measure' && styles.modeButtonTextActive]}>
              Messen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, currentMode === 'scan' && styles.modeButtonActive]}
            onPress={() => setCurrentMode('scan')}
          >
            <Text style={[styles.modeButtonText, currentMode === 'scan' && styles.modeButtonTextActive]}>
              Scannen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {currentMode === 'measure' 
              ? 'Tippen Sie auf Punkte zum Messen'
              : 'Richten Sie die Kamera auf Möbel'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.completeButton, isProcessing && styles.buttonDisabled]} 
            onPress={completeSession}
            disabled={isProcessing}
          >
            <Text style={styles.completeButtonText}>Fertig</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Analysiere...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  arView: {
    flex: 1
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none'
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10
  },
  roomName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  measurementCount: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 5
  },
  modeToggle: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 5
  },
  modeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  modeButtonActive: {
    backgroundColor: '#007AFF'
  },
  modeButtonText: {
    color: '#FFF',
    fontSize: 16
  },
  modeButtonTextActive: {
    fontWeight: 'bold'
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16
  },
  actions: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF'
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10
  },
  loadingText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 20
  }
});