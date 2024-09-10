import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationRequestDto } from 'src/models/RegistrationRequestDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'https://localhost:7161/api/user'; 
 
  constructor(private http: HttpClient) {}

  
 httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  login(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, model, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  register(model: RegistrationRequestDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }


  updateUser(userDto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userDto, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  removeUser(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${email}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?email=${email}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAll`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {    
    console.error('Ocurrió un error', error);
    throw error;
  }
}
