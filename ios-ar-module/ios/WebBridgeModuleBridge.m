#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WebBridgeModule, RCTEventEmitter)

RCT_EXTERN_METHOD(sendMessage:(NSString *)message)

RCT_EXTERN_METHOD(postMessageToWebView:(NSString *)message
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end