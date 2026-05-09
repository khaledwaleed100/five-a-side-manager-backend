import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  description: string;
  isDay: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  // Default coordinates: Damanhur, Beheira, Egypt
  private readonly defaultLat = 31.034;
  private readonly defaultLong = 30.468;

  constructor(private http: HttpClient) {}

  getWeather(lat: number = this.defaultLat, lon: number = this.defaultLong): Observable<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const current = response.current_weather;
        return {
          temperature: current.temperature,
          windspeed: current.windspeed,
          weathercode: current.weathercode,
          isDay: current.is_day,
          description: this.getWeatherDescription(current.weathercode)
        };
      })
    );
  }

  // WMO Weather interpretation codes (WW)
  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm'
    };
    
    return weatherCodes[code] || 'Unknown';
  }
}
