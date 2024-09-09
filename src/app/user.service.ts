import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://tuservidor.com/api/user';  // Cambia a la URL de tu backend

  constructor(private http: HttpClient) {}

  // Login
  login(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, model)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Register
  register(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update
  update(userDto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userDto)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Remove
  remove(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get a user by email
  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?email=${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get all users
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAll`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error:', error);
    throw error;
  }
}
