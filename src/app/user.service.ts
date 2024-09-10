import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://tuservidor.com/api/user';  

  constructor(private http: HttpClient) {}


  login(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, model)
      .pipe(
        catchError(this.handleError)
      );
  }

  
  register(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model)
      .pipe(
        catchError(this.handleError)
      );
  }

  
  update(userDto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userDto)
      .pipe(
        catchError(this.handleError)
      );
  }

  remove(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?email=${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAll`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error:', error);
    throw error;
  }
}
