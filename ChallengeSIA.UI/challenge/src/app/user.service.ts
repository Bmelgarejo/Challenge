import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

  getHttpOptionsWithToken() {
    const token = localStorage.getItem('jwtToken'); 
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      })
    };
  }

  login(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, model, this.httpOptions)
      .pipe(
        map((response: any) => {
          if (response && response.isSuccess && response.result && response.result.token) {
            localStorage.setItem('jwtToken', response.result.token);
          }
          return response;
        }),
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
    return this.http.put(`${this.apiUrl}/update`, userDto, this.getHttpOptionsWithToken())
      .pipe(
        catchError(this.handleError)
      );
  }

  removeUser(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${email}`, this.getHttpOptionsWithToken())
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?email=${email}`, this.getHttpOptionsWithToken())
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAll`, this.getHttpOptionsWithToken())
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
  }

  private handleError(error: any): Observable<never> {    
    console.error('Ocurrió un error', error);
    throw error;
  }
}
