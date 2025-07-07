import Foundation

@objc(WebBridgeModule)
class WebBridgeModule: RCTEventEmitter {
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["WebMessage"]
  }
  
  @objc
  func sendMessage(_ message: String) {
    // Send message to web app
    sendEvent(withName: "WebMessage", body: message)
  }
  
  @objc
  func postMessageToWebView(_ message: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      // This would be handled by the WebView in the main app
      NotificationCenter.default.post(
        name: Notification.Name("ARMessageToWebView"),
        object: nil,
        userInfo: ["message": message]
      )
      resolve(true)
    }
  }
}