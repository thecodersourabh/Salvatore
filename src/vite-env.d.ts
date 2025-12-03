/// <reference types="vite/client" />

// Google Maps API types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string;
                types?: string[];
                componentRestrictions?: { country: string };
              },
              callback: (predictions: any[] | null, status: string) => void
            ) => void;
          };
          PlacesService: new (map: any) => {
            getDetails: (
              request: { placeId: string },
              callback: (result: any, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
      };
    };
  }
}

export {};
