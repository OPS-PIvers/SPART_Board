export interface OpenWeatherData {
  cod: number | string;
  message?: string;
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: [{ main: string }, ...{ main: string }[]];
}

export interface EarthNetworksResponse {
  o?: {
    t: number;
    ic: number;
    fl?: number;
  };
}

export interface GlobalWeatherData {
  temp: number;
  feelsLike?: number;
  condition: string;
  locationName: string;
  updatedAt: number;
  source?: string;
}
