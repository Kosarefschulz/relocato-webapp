/// <reference types="google.maps" />

declare namespace google.maps {
  export interface LatLng {
    lat(): number;
    lng(): number;
  }
  
  export interface Map {
    // Add necessary Map methods/properties if needed
  }
  
  export interface DirectionsRenderer {
    // Add necessary DirectionsRenderer methods/properties if needed
  }
  
  export interface DirectionsService {
    // Add necessary DirectionsService methods/properties if needed
  }
  
  export interface PlacesService {
    // Add necessary PlacesService methods/properties if needed
  }
  
  export enum TravelMode {
    DRIVING = "DRIVING",
    WALKING = "WALKING",
    BICYCLING = "BICYCLING",
    TRANSIT = "TRANSIT"
  }
}