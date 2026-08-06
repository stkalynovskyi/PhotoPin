import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private apiUrl = `${environment.apiUrl}/routes`;
  constructor(private http: HttpClient) {}

  getRoutes(): Observable<any> { return this.http.get(this.apiUrl); }
  saveRoute(name: string, pins: any[]): Observable<any> { return this.http.post(`${this.apiUrl}/save`, { name, pins }); }
  deleteRoute(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/${id}`); }
}
