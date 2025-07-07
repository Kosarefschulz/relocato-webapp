import Foundation
import ARKit
import SceneKit
import UIKit

@objc(ARKitManager)
class ARKitManager: NSObject {
  private var currentSession: ARSession?
  private var currentMeasurements: [ARMeasurement] = []
  private var currentPlanes: [ARPlaneAnchor] = []
  
  @objc
  func getDeviceModel(_ resolve: @escaping RCTPromiseResolveBlock, 
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    var systemInfo = utsname()
    uname(&systemInfo)
    let machineMirror = Mirror(reflecting: systemInfo.machine)
    let identifier = machineMirror.children.reduce("") { identifier, element in
      guard let value = element.value as? Int8, value != 0 else { return identifier }
      return identifier + String(UnicodeScalar(UInt8(value)))
    }
    resolve(identifier)
  }
  
  @objc
  func checkLiDARSupport(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 13.4, *) {
      let supported = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
      resolve(supported)
    } else {
      resolve(false)
    }
  }
  
  @objc
  func hitTest(_ touchPoint: NSDictionary,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let session = currentSession,
          let x = touchPoint["x"] as? CGFloat,
          let y = touchPoint["y"] as? CGFloat else {
      reject("AR_ERROR", "No active session or invalid touch point", nil)
      return
    }
    
    // Perform hit test
    let point = CGPoint(x: x, y: y)
    let results = session.currentFrame?.hitTest(point, types: [.featurePoint, .estimatedHorizontalPlane])
    
    if let firstResult = results?.first {
      let worldTransform = firstResult.worldTransform
      let position = [
        "x": worldTransform.columns.3.x,
        "y": worldTransform.columns.3.y,
        "z": worldTransform.columns.3.z
      ]
      resolve([position])
    } else {
      resolve([])
    }
  }
  
  @objc
  func captureFrame(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let session = currentSession,
          let currentFrame = session.currentFrame else {
      reject("AR_ERROR", "No active session", nil)
      return
    }
    
    // Convert CVPixelBuffer to UIImage
    let pixelBuffer = currentFrame.capturedImage
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    let context = CIContext()
    
    if let cgImage = context.createCGImage(ciImage, from: ciImage.extent) {
      let uiImage = UIImage(cgImage: cgImage)
      
      // Convert to base64
      if let imageData = uiImage.jpegData(compressionQuality: 0.8) {
        let base64String = imageData.base64EncodedString()
        resolve("data:image/jpeg;base64,\(base64String)")
      } else {
        reject("AR_ERROR", "Failed to convert image", nil)
      }
    } else {
      reject("AR_ERROR", "Failed to create image", nil)
    }
  }
  
  @objc
  func getDepthData(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let session = currentSession,
          let currentFrame = session.currentFrame else {
      reject("AR_ERROR", "No active session", nil)
      return
    }
    
    if #available(iOS 14.0, *) {
      if let depthData = currentFrame.sceneDepth?.depthMap {
        // Convert depth data to points
        let width = CVPixelBufferGetWidth(depthData)
        let height = CVPixelBufferGetHeight(depthData)
        
        var points: [[String: Float]] = []
        
        // Sample depth data (every 10th pixel to reduce data size)
        CVPixelBufferLockBaseAddress(depthData, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthData, .readOnly) }
        
        if let baseAddress = CVPixelBufferGetBaseAddress(depthData) {
          let buffer = baseAddress.assumingMemoryBound(to: Float32.self)
          
          for y in stride(from: 0, to: height, by: 10) {
            for x in stride(from: 0, to: width, by: 10) {
              let index = y * width + x
              let depth = buffer[index]
              
              if depth > 0 && depth < 10 { // Valid depth range
                // Convert to world coordinates
                let point = [
                  "x": Float(x - width/2) * depth / Float(width),
                  "y": Float(y - height/2) * depth / Float(height),
                  "z": depth
                ]
                points.append(point)
              }
            }
          }
        }
        
        resolve(["points": points])
      } else {
        resolve(nil)
      }
    } else {
      resolve(nil)
    }
  }
  
  @objc
  func startSession(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    currentSession = ARSession()
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    
    if #available(iOS 13.4, *) {
      if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
        configuration.sceneReconstruction = .mesh
      }
    }
    
    currentSession?.run(configuration)
    resolve(true)
  }
  
  @objc
  func stopSession(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    currentSession?.pause()
    currentSession = nil
    currentMeasurements = []
    currentPlanes = []
    resolve(true)
  }
}

// Helper structures
struct ARMeasurement {
  let id: String
  let type: String
  let points: [[String: Float]]
  let value: Float
  let unit: String
  let confidence: Float
  let timestamp: Date
}