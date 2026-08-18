// Minimal ambient types for the subset of the Kakao Maps JS SDK this app uses.
// Not an exhaustive typing of the SDK.

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    relayout(): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: string | HTMLElement;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
