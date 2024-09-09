import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationRequestDto } from 'src/models/RegistrationRequestDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'https://localhost:7161/api/user'; // Cambia esto por tu URL de la API
 
  constructor(private http: HttpClient) {}

  // Headers para las peticiones
 httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // Método para login
  login(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, model, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para registro
  register(model: RegistrationRequestDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }


  // Método para actualizar un usuario
  updateUser(userDto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userDto, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para eliminar un usuario
  removeUser(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${email}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para obtener un usuario por email
  getUserByEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?email=${email}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para obtener todos los usuarios
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAll`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores (opcional)
  private handleError(error: any): Observable<never> {
    // Puedes agregar un log de errores aquí o mostrar un mensaje al usuario
    console.error('Ocurrió un error', error);
    throw error;
  }
}
