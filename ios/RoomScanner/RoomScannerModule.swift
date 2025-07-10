import Foundation
import RoomPlan
import ARKit
import React

@objc(RoomScannerModule)
class RoomScannerModule: RCTEventEmitter, RoomCaptureSessionDelegate {
    private var captureSession: RoomCaptureSession?
    private var capturedRoom: CapturedRoom?
    private var hasListeners = false
    
    override init() {
        super.init()
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return [
            "onRoomCaptureUpdate",
            "onRoomCaptureComplete",
            "onRoomCaptureError",
            "onFurnitureDetected",
            "onVolumeCalculated"
        ]
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    @objc
    func checkDeviceSupport(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            resolve([
                "supported": false,
                "reason": "iOS 16 or later required"
            ])
            return
        }
        
        let isSupported = RoomCaptureSession.isSupported
        let hasLiDAR = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
        
        resolve([
            "supported": isSupported,
            "hasLiDAR": hasLiDAR,
            "deviceModel": UIDevice.current.model
        ])
    }
    
    @objc
    func startRoomCapture(_ options: NSDictionary,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            reject("UNSUPPORTED", "iOS 16 or later required", nil)
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            self?.captureSession = RoomCaptureSession()
            self?.captureSession?.delegate = self
            
            let config = RoomCaptureSession.Configuration()
            config.isCoachingEnabled = true
            
            self?.captureSession?.run(configuration: config)
            resolve(["status": "started"])
        }
    }
    
    @objc
    func stopRoomCapture(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.0, *) else {
            reject("UNSUPPORTED", "iOS 16 or later required", nil)
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            self?.captureSession?.stop()
            
            if let room = self?.capturedRoom {
                let roomData = self?.processRoomData(room) ?? [:]
                resolve(roomData)
            } else {
                resolve(["status": "stopped", "room": nil])
            }
        }
    }
    
    // MARK: - RoomCaptureSessionDelegate
    
    @available(iOS 16.0, *)
    func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
        self.capturedRoom = room
        
        guard hasListeners else { return }
        
        // Calculate room volume
        let volume = calculateRoomVolume(room)
        
        // Detect furniture
        let furniture = room.objects.map { object in
            return [
                "category": mapObjectCategory(object.category),
                "dimensions": [
                    "width": object.dimensions.x,
                    "height": object.dimensions.y,
                    "depth": object.dimensions.z
                ],
                "volume": object.dimensions.x * object.dimensions.y * object.dimensions.z,
                "confidence": object.confidence?.rawValue ?? 0
            ]
        }
        
        // Send updates to React Native
        sendEvent(withName: "onRoomCaptureUpdate", body: [
            "status": "capturing",
            "roomVolume": volume,
            "furnitureCount": furniture.count,
            "walls": room.walls.count,
            "doors": room.doors.count,
            "windows": room.windows.count
        ])
        
        if !furniture.isEmpty {
            sendEvent(withName: "onFurnitureDetected", body: [
                "furniture": furniture
            ])
        }
        
        sendEvent(withName: "onVolumeCalculated", body: [
            "volume": volume,
            "unit": "m³"
        ])
    }
    
    @available(iOS 16.0, *)
    func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoomData, error: Error?) {
        if let error = error {
            sendEvent(withName: "onRoomCaptureError", body: [
                "error": error.localizedDescription
            ])
            return
        }
        
        guard hasListeners else { return }
        
        sendEvent(withName: "onRoomCaptureComplete", body: [
            "status": "completed",
            "exportPath": exportRoomData(data)
        ])
    }
    
    // MARK: - Helper Methods
    
    @available(iOS 16.0, *)
    private func calculateRoomVolume(_ room: CapturedRoom) -> Double {
        // Calculate bounding box of the room
        var minPoint = simd_float3(Float.infinity, Float.infinity, Float.infinity)
        var maxPoint = simd_float3(-Float.infinity, -Float.infinity, -Float.infinity)
        
        // Include all surfaces (walls, floor, ceiling)
        for surface in room.surfaces {
            let dimensions = surface.dimensions
            minPoint = simd_min(minPoint, surface.transform.columns.3.xyz - dimensions/2)
            maxPoint = simd_max(maxPoint, surface.transform.columns.3.xyz + dimensions/2)
        }
        
        let roomSize = maxPoint - minPoint
        let volume = Double(roomSize.x * roomSize.y * roomSize.z)
        
        return volume
    }
    
    @available(iOS 16.0, *)
    private func mapObjectCategory(_ category: CapturedRoom.Object.Category) -> String {
        switch category {
        case .storage:
            return "Schrank"
        case .refrigerator:
            return "Kühlschrank"
        case .stove:
            return "Herd"
        case .bed:
            return "Bett"
        case .sink:
            return "Spüle"
        case .washerDryer:
            return "Waschmaschine"
        case .toilet:
            return "Toilette"
        case .bathtub:
            return "Badewanne"
        case .oven:
            return "Ofen"
        case .dishwasher:
            return "Spülmaschine"
        case .table:
            return "Tisch"
        case .sofa:
            return "Sofa"
        case .chair:
            return "Stuhl"
        case .fireplace:
            return "Kamin"
        case .television:
            return "Fernseher"
        @unknown default:
            return "Sonstiges"
        }
    }
    
    @available(iOS 16.0, *)
    private func processRoomData(_ room: CapturedRoom) -> [String: Any] {
        return [
            "volume": calculateRoomVolume(room),
            "dimensions": [
                "length": room.walls.map { $0.dimensions.x }.max() ?? 0,
                "width": room.walls.map { $0.dimensions.z }.max() ?? 0,
                "height": room.walls.map { $0.dimensions.y }.max() ?? 0
            ],
            "furniture": room.objects.map { object in
                [
                    "type": mapObjectCategory(object.category),
                    "volume": object.dimensions.x * object.dimensions.y * object.dimensions.z
                ]
            },
            "summary": [
                "totalVolume": calculateRoomVolume(room),
                "furnitureCount": room.objects.count,
                "wallCount": room.walls.count,
                "doorCount": room.doors.count,
                "windowCount": room.windows.count
            ]
        ]
    }
    
    @available(iOS 16.0, *)
    private func exportRoomData(_ data: CapturedRoomData) -> String? {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let fileName = "room_scan_\(Date().timeIntervalSince1970).usdz"
        let fileURL = documentsDirectory.appendingPathComponent(fileName)
        
        do {
            try data.export(to: fileURL)
            return fileURL.path
        } catch {
            print("Error exporting room data: \(error)")
            return nil
        }
    }
}

// MARK: - Helper Extensions

extension simd_float4 {
    var xyz: simd_float3 {
        return simd_float3(x, y, z)
    }
}